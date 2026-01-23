import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { parse as parseCookie } from 'cookie';
import { ContactService } from '../services/contact.service';
import { User } from '../../shared/user.contract';
import { JwtService } from '@nestjs/jwt';
import { OnlineStatusService } from 'src/services/online-status.service';
import { SocketMessageTypes } from '../../shared/socket-message-types.enum';
import { WsConnectionThrottlerService } from '../services/ws-connection-throttler.service';
import { WsConnectionThrottledException } from '../errors/ws/ws-connection-throttled.exception';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
})
export class RealTimeChatGateway
    implements OnGatewayConnection, OnGatewayDisconnect
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
    ) {
        const jwtSecret = this.configService.get('JWT_SECRET');
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is required');
        }

        this.JWT_SECRET = jwtSecret;
    }

    async handleConnection(socket: Socket): Promise<void> {
        // Check throttle first - before authentication
        const throttleResult = await this.wsThrottler.checkAndTrack(socket);
        if (!throttleResult.allowed) {
            const exception = new WsConnectionThrottledException(
                throttleResult.retryAfterMs ?? 60000,
            );
            socket.emit('error', exception.toClientPayload());
            socket.disconnect(true);
            return;
        }

        if (!this.canSocketBeAuthenticated(socket)) {
            return;
        }

        const userId = socket.handshake.query.userId as string;
        this.logger.log(`New connection: ${socket.id} for user: ${userId}`);

        // Join the socket to a room named after the userId
        socket.join(userId);

        this.onlineStatusService.setContactOnline(userId, true);

        this.contactService
            .getUsersThatHaveContact(userId)
            .then((contacts: User[]) => {
                this.server
                    .to(contacts.map((c) => c._id.toString()))
                    .emit(SocketMessageTypes.contactOnline, userId);
            });
    }

    canSocketBeAuthenticated(socket: Socket): boolean {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) {
            this.logger.warn(`No cookies for socket ${socket.id}`);
            socket.disconnect();
            return false;
        }

        const parsed = parseCookie(cookies);
        const token = parsed.accessToken;

        if (!token) {
            this.logger.warn(`No accessToken cookie for socket ${socket.id}`);
            socket.disconnect();
            return false;
        }

        try {
            this.jwtService.verify(token, {
                secret: this.JWT_SECRET,
            });
            return true;
        } catch (err: unknown) {
            this.logger.warn(
                `Unable to verify token for socket ${socket.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
            socket.disconnect();
            return false;
        }
    }

    handleDisconnect(socket: Socket): void {
        const userId = socket.handshake.query.userId as string;
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
        const userId = client.handshake.query.userId as string;
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
        payload: { userId: string; contactId: string; isTyping: boolean },
    ): Promise<void> {
        const userId = client.handshake.query.userId as string;
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
            userId: payload.userId,
            isTyping: payload.isTyping,
        });
    }

    // Method to send a message to a specific user using their room
    prepareSendMessage(userId: string) {
        return this.server.to(userId);
    }
}
