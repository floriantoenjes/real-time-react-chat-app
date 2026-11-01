import { TestBed } from '@suites/unit';
import { Mocked } from '@suites/doubles.jest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { RealTimeChatGateway } from './socket.gateway';
import { WsConnectionThrottlerService } from './ws-connection-throttler.service';
import { OnlineStatusService } from '../online-status/online-status.service';
import { ContactService } from '../relationships/contact/contact.service';
import { UserEntity } from '../user/user.schema';
import { SocketMessageTypes } from '../../../shared/socket-message-types.enum';
import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { WsConnectError } from '../../errors/ws/ws-connect.error';

// The token's sub is the auth user id; the gateway has to map it to the
// chat user id (rooms and events use the chat user id)
const AUTH_USER_A = 'authUserA';
const USER_A = 'userA';
const USER_B = 'userB';
const VALID_TOKEN_A = 'validTokenA';
const VALID_TOKEN_WITHOUT_USER = 'validTokenWithoutUser';

type FakeSocket = ReturnType<typeof createSocket>;

function createSocket(options: { cookie?: string; queryUserId?: string }) {
    return {
        id: 'socket1',
        data: {} as Record<string, unknown>,
        handshake: {
            headers: options.cookie ? { cookie: options.cookie } : {},
            query: options.queryUserId ? { userId: options.queryUserId } : {},
        },
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
    };
}

describe('RealTimeChatGateway authentication', () => {
    let gateway: RealTimeChatGateway;
    let onlineStatusService: Mocked<OnlineStatusService>;
    let wsThrottler: Mocked<WsConnectionThrottlerService>;
    let roomEmit: jest.Mock;
    let serverTo: jest.Mock;
    let userModel: { findOne: jest.Mock };

    beforeEach(async () => {
        const { unit, unitRef } = await TestBed.solitary(RealTimeChatGateway)
            .mock(ConfigService)
            .impl((stubFn) => ({
                get: stubFn().mockReturnValue('test-secret'),
            }))
            .mock(JwtService)
            .impl((stubFn) => ({
                verify: stubFn().mockImplementation((token: string) => {
                    if (token === VALID_TOKEN_A) {
                        return { sub: AUTH_USER_A, email: 'a@example.com' };
                    }
                    if (token === VALID_TOKEN_WITHOUT_USER) {
                        return { sub: 'authUserGone', email: 'x@example.com' };
                    }
                    throw new Error('invalid signature');
                }),
            }))
            .mock(WsConnectionThrottlerService)
            .impl((stubFn) => ({
                checkAndTrack: stubFn().mockResolvedValue({ allowed: true }),
                checkMessageThrottle: stubFn().mockResolvedValue({
                    allowed: true,
                }),
            }))
            .mock(ContactService)
            .impl((stubFn) => ({
                getUsersThatHaveContact: stubFn().mockResolvedValue([]),
            }))
            .mock(getModelToken(UserEntity.name))
            .impl((stubFn) => ({
                findOne: stubFn().mockImplementation(
                    (filter: { authUserId: string }) => ({
                        lean: () =>
                            Promise.resolve(
                                filter.authUserId === AUTH_USER_A
                                    ? { _id: { toString: () => USER_A } }
                                    : null,
                            ),
                    }),
                ),
            }))
            .compile();

        gateway = unit;
        onlineStatusService = unitRef.get(OnlineStatusService);
        wsThrottler = unitRef.get(WsConnectionThrottlerService);
        userModel = unitRef.get(getModelToken(UserEntity.name) as never);

        roomEmit = jest.fn();
        serverTo = jest.fn().mockReturnValue({ emit: roomEmit });
        gateway.server = { to: serverTo } as never;
    });

    /**
     * Runs the connection the way Socket.IO does: the middleware registered in
     * afterInit first, then handleConnection only if the middleware passed.
     * Returns the error passed to next(), if any.
     */
    async function connect(socket: FakeSocket): Promise<Error | undefined> {
        let middleware!: (
            socket: FakeSocket,
            next: (err?: Error) => void,
        ) => void;
        gateway.afterInit({
            use: (fn: typeof middleware) => (middleware = fn),
        } as never);

        const error = await new Promise<Error | undefined>((resolve) =>
            middleware(socket, resolve),
        );
        if (!error) {
            gateway.handleConnection(socket as never);
        }
        return error;
    }

    describe('connection', () => {
        it('joins the room of the token subject, not the userId from the query', async () => {
            const socket = createSocket({
                cookie: `accessToken=${VALID_TOKEN_A}`,
                queryUserId: USER_B,
            });

            const error = await connect(socket);

            expect(error).toBeUndefined();
            expect(socket.join).toHaveBeenCalledTimes(1);
            expect(socket.join).toHaveBeenCalledWith(USER_A);
            expect(socket.data.userId).toBe(USER_A);
            expect(onlineStatusService.setContactOnline).toHaveBeenCalledWith(
                USER_A,
                true,
            );
            expect(
                onlineStatusService.setContactOnline,
            ).not.toHaveBeenCalledWith(USER_B, expect.anything());
        });

        it.each([
            ['no cookie', undefined],
            ['no accessToken cookie', 'other=1'],
            ['an invalid token', 'accessToken=forged'],
            [
                'a token whose user does not exist',
                `accessToken=${VALID_TOKEN_WITHOUT_USER}`,
            ],
        ])('rejects a socket with %s', async (_, cookie) => {
            const socket = createSocket({ cookie, queryUserId: USER_B });

            const error = await connect(socket);

            expect(error).toBeInstanceOf(WsConnectError);
            expect((error as WsConnectError).data.errorCode).toBe(
                ExternalErrors.EXT_AUTH_002,
            );
            expect(socket.join).not.toHaveBeenCalled();
            expect(socket.data.userId).toBeUndefined();
            expect(onlineStatusService.setContactOnline).not.toHaveBeenCalled();
        });

        it('rejects a throttled socket before authenticating it', async () => {
            wsThrottler.checkAndTrack.mockResolvedValueOnce({
                allowed: false,
                retryAfterMs: 1234,
            });
            const socket = createSocket({
                cookie: `accessToken=${VALID_TOKEN_A}`,
            });

            const error = await connect(socket);

            expect((error as WsConnectError).data).toEqual({
                errorCode: ExternalErrors.EXT_WS_THROTTLE_001,
                message: expect.any(String),
                retryAfterMs: 1234,
            });
            expect(socket.join).not.toHaveBeenCalled();
            expect(onlineStatusService.setContactOnline).not.toHaveBeenCalled();
        });

        it('rejects the socket as unauthorized if the user lookup fails', async () => {
            userModel.findOne.mockImplementationOnce(() => ({
                lean: () => Promise.reject(new Error('mongo down')),
            }));
            const socket = createSocket({
                cookie: `accessToken=${VALID_TOKEN_A}`,
            });

            const error = await connect(socket);

            expect((error as WsConnectError).data.errorCode).toBe(
                ExternalErrors.EXT_AUTH_002,
            );
            expect(socket.join).not.toHaveBeenCalled();
        });
    });

    describe('handleDisconnect', () => {
        it('sets the token subject offline', async () => {
            const socket = createSocket({
                cookie: `accessToken=${VALID_TOKEN_A}`,
                queryUserId: USER_B,
            });
            await connect(socket);

            gateway.handleDisconnect(socket as never);

            expect(socket.leave).toHaveBeenCalledWith(USER_A);
            expect(onlineStatusService.setContactOffline).toHaveBeenCalledWith(
                USER_A,
                true,
            );
        });

        it('does not set anyone offline for an unauthenticated socket', async () => {
            const socket = createSocket({
                cookie: 'accessToken=forged',
                queryUserId: USER_B,
            });
            await connect(socket);

            gateway.handleDisconnect(socket as never);

            expect(socket.leave).not.toHaveBeenCalled();
            expect(
                onlineStatusService.setContactOffline,
            ).not.toHaveBeenCalled();
        });
    });

    describe('handleTyping', () => {
        it('sends the token subject as userId, ignoring the userId in the payload', async () => {
            const socket = createSocket({
                cookie: `accessToken=${VALID_TOKEN_A}`,
            });
            await connect(socket);

            await gateway.handleTyping(
                socket as never,
                {
                    userId: USER_B,
                    contactId: 'contact1',
                    isTyping: true,
                } as never,
            );

            expect(serverTo).toHaveBeenCalledWith('contact1');
            expect(roomEmit).toHaveBeenCalledWith(SocketMessageTypes.typing, {
                userId: USER_A,
                isTyping: true,
            });
            expect(wsThrottler.checkMessageThrottle).toHaveBeenCalledWith(
                USER_A,
                'typing',
            );
        });

        it('ignores typing events from unauthenticated sockets', async () => {
            const socket = createSocket({ queryUserId: USER_B });

            await gateway.handleTyping(socket as never, {
                contactId: 'contact1',
                isTyping: true,
            });

            expect(roomEmit).not.toHaveBeenCalled();
        });
    });

    describe('pong', () => {
        it('ignores pings from unauthenticated sockets', async () => {
            const socket = createSocket({ queryUserId: USER_B });

            await gateway.pong(socket as never);

            expect(socket.emit).not.toHaveBeenCalled();
        });
    });
});
