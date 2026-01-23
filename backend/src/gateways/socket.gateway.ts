import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ContactService } from '../services/contact.service';
import { User } from '../../shared/user.contract';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../services/auth-constants';
import { OnlineStatusService } from 'src/services/online-status.service';
import { SocketMessageTypes } from '../../shared/socket-message-types.enum';
import { WsConnectionThrottlerService } from '../services/ws-connection-throttler.service';
import { WsConnectionThrottledException } from '../errors/ws/ws-connection-throttled.exception';

@WebSocketGateway({
    cors: {
        origin: '*', // Replace with your frontend domain if needed
        methods: ['GET', 'POST'],
        credentials: true,
    },
})
export class RealTimeChatGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    private readonly logger = new Logger(RealTimeChatGateway.name);

    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly contactService: ContactService,
        private readonly jwtService: JwtService,
        private readonly onlineStatusService: OnlineStatusService,
        private readonly wsThrottler: WsConnectionThrottlerService,
    ) {}

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
        const token = socket.handshake.headers.cookie?.split('accessToken=')[1];
        if (!token) {
            this.logger.warn(`No token for socket ${socket.id}`);
            socket.disconnect();
            return false;
        }

        try {
            this.jwtService.verify(token, {
                secret: jwtConstants.secret,
            });
            return true;
        } catch (err: unknown) {
            this.logger.warn(
                `Unable to verify token ${token} for socket ${socket.id}`,
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

    @SubscribeMessage(SocketMessageTypes.message)
    handleMessage(client: Socket, payload: any): void {
        this.logger.debug('Message received in gateway: ' + payload);
        // Broadcast to all clients
        this.server.emit(SocketMessageTypes.message, {
            text: 'Hello from server',
        });
    }

    @SubscribeMessage(SocketMessageTypes.ping)
    pong(client: Socket): void {
        client.emit(SocketMessageTypes.pong);
    }

    @SubscribeMessage(SocketMessageTypes.typing)
    handleTyping(
        client: Socket,
        payload: { userId: string; contactId: string; isTyping: boolean },
    ): void {
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
