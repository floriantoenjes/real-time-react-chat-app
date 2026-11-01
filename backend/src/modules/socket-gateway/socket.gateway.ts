import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { parse as parseCookie } from 'cookie';
import { ContactService } from '../relationships/contact/contact.service';
import { User } from '../../../shared/user.contract';
import { JwtService } from '@nestjs/jwt';
import { OnlineStatusService } from '../online-status/online-status.service';
import { SocketMessageTypes } from '../../../shared/socket-message-types.enum';
import { WsConnectionThrottlerService } from './ws-connection-throttler.service';
import { WsConnectionThrottledException } from '../../errors/ws/ws-connection-throttled.exception';
import {
    WsConnectError,
    WsUnauthorizedError,
} from '../../errors/ws/ws-connect.error';
import { ConfigService } from '@nestjs/config';
import { EventBusService } from '../global/event-bus.service';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from '../user/user.schema';
import { Model } from 'mongoose';
import {
    UserIgnoredEvent,
    UserProfileUpdatedEvent,
    UserUnignoredEvent,
} from '../../events/user.events';
import {
    ContactAddedEvent,
    ContactGroupAutoAddEvent,
} from '../../events/contact.events';
import {
    MessageReadEvent,
    MessageSentEvent,
} from '../../events/message.events';
import { EventNames } from '../../events/event-names.enum';
import { JwtPayload } from '../../types/jwt.types';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
})
export class RealTimeChatGateway
    implements
        OnGatewayInit,
        OnGatewayConnection,
        OnGatewayDisconnect,
        OnModuleInit
{
    private readonly JWT_SECRET: string;

    private readonly logger = new Logger(RealTimeChatGateway.name);

    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly configService: ConfigService,
        private readonly contactService: ContactService,
        private readonly jwtService: JwtService,
        private readonly onlineStatusService: OnlineStatusService,
        private readonly wsThrottler: WsConnectionThrottlerService,
        private readonly eventBus: EventBusService,
        @InjectModel(UserEntity.name)
        private readonly userModel: Model<UserEntity>,
    ) {
        const jwtSecret = this.configService.get('JWT_SECRET');
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is required');
        }

        this.JWT_SECRET = jwtSecret;
    }

    /**
     * Set up event listeners after module initialization
     */
    onModuleInit(): void {
        this.processMessageEvents();
        this.processContactEvents();
        this.processIgnoreEvents();
        this.processProfileEvents();
    }

    private processProfileEvents() {
        this.eventBus.on<UserProfileUpdatedEvent>(
            EventNames.USER_PROFILE_UPDATED,
            async (payload: UserProfileUpdatedEvent) => {
                try {
                    const usersWithContact =
                        await this.contactService.getUsersThatHaveContact(
                            payload.userId,
                        );
                    this.logger.debug(
                        `Broadcasting profile update of ${payload.userId} to ${usersWithContact.length} users`,
                    );
                    // The user's own room is included so their other sessions update as well
                    this.server
                        .to([
                            ...usersWithContact.map((u) => u._id.toString()),
                            payload.userId,
                        ])
                        .emit(
                            SocketMessageTypes.contactProfileUpdated,
                            payload,
                        );
                } catch (error) {
                    this.logger.error(
                        `Failed to broadcast profile update of ${payload.userId}: ${error}`,
                    );
                }
            },
        );
    }

    private processIgnoreEvents() {
        this.eventBus.on<UserIgnoredEvent>(
            EventNames.USER_IGNORED,
            (payload: UserIgnoredEvent) => {
                this.logger.debug(
                    `Broadcasting user ignored: ${payload.ignoredUserId} by ${payload.userId}`,
                );
                this.server
                    .to(payload.userId)
                    .emit(
                        SocketMessageTypes.userIgnored,
                        payload.ignoredUserId,
                    );
            },
        );

        this.eventBus.on<UserUnignoredEvent>(
            EventNames.USER_UNIGNORED,
            (payload: UserUnignoredEvent) => {
                this.logger.debug(
                    `Broadcasting user unignored: ${payload.unignoredUserId} by ${payload.userId}`,
                );
                this.server
                    .to(payload.userId)
                    .emit(
                        SocketMessageTypes.userUnignored,
                        payload.unignoredUserId,
                    );
            },
        );
    }

    private processContactEvents() {
        this.eventBus.on<ContactAddedEvent>(
            EventNames.CONTACT_ADDED,
            (payload: ContactAddedEvent) => {
                this.logger.debug(
                    `Broadcasting contact added ${payload.contact._id} for user ${payload.userId}`,
                );
                this.server
                    .to(payload.userId)
                    .emit(SocketMessageTypes.contactAutoAdded, payload.contact);
            },
        );

        this.eventBus.on<ContactGroupAutoAddEvent>(
            EventNames.CONTACT_GROUP_AUTO_ADD,
            async (payload: ContactGroupAutoAddEvent) => {
                // Check if user has left this group before broadcasting
                const user = await this.userModel
                    .findById(payload.userId)
                    .select('leftGroupIds')
                    .lean();

                if (user?.leftGroupIds?.includes(payload.group._id)) {
                    this.logger.debug(
                        `Skipping CONTACT_GROUP_AUTO_ADD for user ${payload.userId} - has left group ${payload.group._id}`,
                    );
                    return;
                }

                this.logger.debug(
                    `Auto-adding group ${payload.group._id} for user ${payload.userId}`,
                );
                this.server
                    .to(payload.userId)
                    .emit(
                        SocketMessageTypes.contactGroupAutoAdded,
                        payload.group,
                    );
            },
        );
    }

    private processMessageEvents() {
        this.eventBus.on<MessageSentEvent>(
            EventNames.MESSAGE_SENT,
            (payload: MessageSentEvent) => {
                this.logger.debug(
                    `Broadcasting message ${payload.message._id.toString()} to ${payload.recipientId}`,
                );
                this.server
                    .to(payload.recipientId)
                    .emit(SocketMessageTypes.message, payload.message);
            },
        );

        this.eventBus.on<MessageReadEvent>(
            EventNames.MESSAGE_READ,
            (payload: MessageReadEvent) => {
                this.logger.debug(
                    `Broadcasting message read ${payload.messageId} to ${payload.messageAuthorId}`,
                );
                this.server
                    .to(payload.messageAuthorId)
                    .emit(SocketMessageTypes.messageRead, payload.messageId);
            },
        );
    }

    /**
     * Registers the connection middleware. Socket.IO runs it before it confirms
     * the connection to the client, so a client's `connect` event means the
     * socket is authenticated and already in its user's room.
     */
    afterInit(server: Server): void {
        server.use((socket, next) => {
            this.authenticateConnection(socket).then(
                () => next(),
                (err: unknown) => {
                    if (err instanceof WsConnectError) {
                        next(err);
                        return;
                    }
                    // e.g. Redis or MongoDB unavailable
                    this.logger.error(
                        `Unable to authenticate socket ${socket.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
                        err instanceof Error ? err.stack : undefined,
                    );
                    next(new WsUnauthorizedError());
                },
            );
        });
    }

    /**
     * Throttles connection attempts, then resolves the chat user from the
     * access token cookie and joins the socket to that user's room. Throws a
     * WsConnectError, which Socket.IO sends to the client as `connect_error`.
     * The user id comes from the verified token only; anything the client sends
     * (e.g. the handshake query) is not trusted.
     */
    async authenticateConnection(socket: Socket): Promise<void> {
        // Check throttle first - before authentication
        const throttleResult = await this.wsThrottler.checkAndTrack(socket);
        if (!throttleResult.allowed) {
            throw new WsConnectionThrottledException(
                throttleResult.retryAfterMs ?? 60000,
            );
        }

        const userId = await this.resolveUserId(socket);
        socket.data.userId = userId;
        // Joined before the client is told it is connected, so events sent
        // right after `connect` already reach this socket
        await socket.join(userId);
    }

    /**
     * Verifies the access token cookie and returns the id of the chat user it
     * belongs to. The token's `sub` is the auth user id, so it is mapped to the
     * user id the same way as in AuthGuard.
     */
    private async resolveUserId(socket: Socket): Promise<string> {
        const cookies = socket.handshake.headers.cookie;
        const token = cookies ? parseCookie(cookies).accessToken : undefined;
        if (!token) {
            this.logger.warn(`No accessToken cookie for socket ${socket.id}`);
            throw new WsUnauthorizedError();
        }

        let authUserId: string;
        try {
            const payload = this.jwtService.verify<JwtPayload>(token, {
                secret: this.JWT_SECRET,
            });
            authUserId = payload?.sub;
        } catch (err: unknown) {
            this.logger.warn(
                `Unable to verify token for socket ${socket.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
            throw new WsUnauthorizedError();
        }
        if (!authUserId) {
            this.logger.warn(`Token without sub for socket ${socket.id}`);
            throw new WsUnauthorizedError();
        }

        const user = await this.userModel
            .findOne({ authUserId }, { _id: 1 })
            .lean();
        if (!user) {
            this.logger.warn(
                `No user for auth user ${authUserId} on socket ${socket.id}`,
            );
            throw new WsUnauthorizedError();
        }
        return user._id.toString();
    }

    handleConnection(socket: Socket): void {
        const userId = this.getAuthenticatedUserId(socket);
        if (!userId) {
            // Can't happen: the middleware rejects unauthenticated sockets
            socket.disconnect(true);
            return;
        }
        this.logger.log(`New connection: ${socket.id} for user: ${userId}`);

        this.onlineStatusService.setContactOnline(userId, true);

        this.contactService
            .getUsersThatHaveContact(userId)
            .then((contacts: User[]) => {
                this.server
                    .to(contacts.map((c) => c._id.toString()))
                    .emit(SocketMessageTypes.contactOnline, userId);
            });
    }

    handleDisconnect(socket: Socket): void {
        const userId = this.getAuthenticatedUserId(socket);
        if (!userId) {
            // Rejected by the middleware, never connected
            return;
        }
        this.logger.log(
            `Client disconnected: ${socket.id} for user: ${userId}`,
        );
        // Leave the room when the socket disconnects
        socket.leave(userId);

        this.onlineStatusService.setContactOffline(userId, true);

        this.contactService
            .getUsersThatHaveContact(userId)
            .then((contacts: User[]) => {
                this.server
                    .to(contacts.map((c) => c._id.toString()))
                    .emit(SocketMessageTypes.contactOffline, userId);
            });
    }

    @SubscribeMessage(SocketMessageTypes.ping)
    async pong(client: Socket): Promise<void> {
        const userId = this.getAuthenticatedUserId(client);
        if (!userId) {
            return;
        }
        const throttleResult = await this.wsThrottler.checkMessageThrottle(
            userId,
            'ping',
        );
        if (!throttleResult.allowed) {
            client.emit('error', {
                error: 'MESSAGE_THROTTLED',
                messageType: SocketMessageTypes.ping,
                retryAfterMs: throttleResult.retryAfterMs,
            });
            return;
        }

        client.emit(SocketMessageTypes.pong);
    }

    @SubscribeMessage(SocketMessageTypes.typing)
    async handleTyping(
        client: Socket,
        payload: { contactId: string; isTyping: boolean },
    ): Promise<void> {
        const userId = this.getAuthenticatedUserId(client);
        if (!userId) {
            return;
        }
        const throttleResult = await this.wsThrottler.checkMessageThrottle(
            userId,
            'typing',
        );
        if (!throttleResult.allowed) {
            client.emit('error', {
                error: 'MESSAGE_THROTTLED',
                messageType: SocketMessageTypes.typing,
                retryAfterMs: throttleResult.retryAfterMs,
            });
            return;
        }

        this.server.to(payload.contactId).emit(SocketMessageTypes.typing, {
            userId,
            isTyping: payload.isTyping,
        });
    }

    private getAuthenticatedUserId(socket: Socket): string | undefined {
        const userId: unknown = socket.data?.userId;
        return typeof userId === 'string' ? userId : undefined;
    }

    // Method to send a message to a specific user using their room
    prepareSendMessage(userId: string) {
        return this.server.to(userId);
    }
}
