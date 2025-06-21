import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ContactService } from '../services/contact.service';
import { User } from '../../shared/user.contract';
import { CustomLogger } from '../logging/custom-logger';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../services/auth-constants';
import { OnlineStatusService } from 'src/services/online-status.service';

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
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly contactService: ContactService,
        private readonly jwtService: JwtService,
        private readonly logger: CustomLogger,
        private readonly onlineStatusService: OnlineStatusService,
    ) {}

    handleConnection(socket: Socket): void {
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
                    .emit('contactOnline', userId);
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

        this.onlineStatusService.setContactOnline(userId, true);

        // TODO: make sure that signing out of the frontend triggers offline-update too
        this.contactService
            .getUsersThatHaveContact(userId)
            .then((contacts: User[]) => {
                this.server
                    .to(contacts.map((c) => c._id.toString()))
                    .emit('contactOffline', userId);
            });
    }

    @SubscribeMessage('message')
    handleMessage(client: Socket, payload: any): void {
        this.logger.debug('Message received in gateway: ' + payload);
        // Broadcast to all clients
        this.server.emit('message', { text: 'Hello from server' });
    }

    @SubscribeMessage('ping')
    pong(client: Socket): void {
        client.emit('pong');
    }

    @SubscribeMessage('typing')
    handleTyping(
        client: Socket,
        payload: { userId: string; contactId: string },
    ): void {
        this.server.to(payload.contactId).emit('typing', payload.userId);
    }

    // Method to send a message to a specific user using their room
    prepareSendMessage(userId: string) {
        return this.server.to(userId);
    }
}
