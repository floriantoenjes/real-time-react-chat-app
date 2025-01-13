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
import { createClient } from 'redis';
import { CustomLogger } from '../logging/custom-logger';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../services/constants';

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

    private readonly pubClient: ReturnType<typeof createClient>;
    private readonly subClient: ReturnType<typeof createClient>;

    private readonly onlineUsersSet: Set<string> = new Set<string>();

    constructor(
        private readonly contactService: ContactService,
        private readonly jwtService: JwtService,
        private readonly logger: CustomLogger,
    ) {
        this.pubClient = createClient({
            url: process.env.redis ?? `redis://localhost:6379`,
        });
        this.subClient = this.pubClient.duplicate();

        void this.pubClient.connect();
        void this.subClient.connect();

        void this.subClient.subscribe('userOnlineServerSync', (userId) =>
            this.setContactOnline(userId),
        );
        void this.subClient.subscribe('userOfflineServerSync', (userId) =>
            this.setContactOffline(userId),
        );
    }

    handleConnection(socket: Socket): void {
        const token = socket.handshake?.auth?.Authorization?.split(' ')[1];
        if (!token) {
            this.logger.warn(`No token for socket ${socket.id}`);
            socket.disconnect();
            return;
        }

        try {
            this.jwtService.verify(token, {
                secret: jwtConstants.secret,
            });
        } catch (err) {
            this.logger.warn(
                `Unable to verify token ${token} for socket ${socket.id}`,
            );
            socket.disconnect();
            return;
        }

        const userId = socket.handshake.query.userId as string;
        this.logger.log(`New connection: ${socket.id} for user: ${userId}`);

        // Join the socket to a room named after the userId
        socket.join(userId);

        this.onlineUsersSet.add(userId);
        void this.pubClient.publish('userOnlineServerSync', userId);

        this.contactService
            .getUsersThatHaveContact(userId)
            .then((contacts: User[]) => {
                this.server
                    .to(contacts.map((c) => c._id.toString()))
                    .emit('contactOnline', userId);
            });
    }

    handleDisconnect(socket: Socket): void {
        const userId = socket.handshake.query.userId as string;
        this.logger.log(
            `Client disconnected: ${socket.id} for user: ${userId}`,
        );
        // Leave the room when the socket disconnects
        socket.leave(userId);

        this.onlineUsersSet.delete(userId);
        void this.pubClient.publish('userOfflineServerSync', userId);

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
    pong(client: Socket, payload: any): void {
        client.emit('pong');
    }

    @SubscribeMessage('typing')
    handleTyping(
        client: Socket,
        payload: { userId: string; contactId: string },
    ): void {
        this.server.to(payload.contactId).emit('typing', payload.userId);
    }

    setContactOnline(userId: string) {
        this.logger.debug(`New contact online: ${userId}`);
        this.onlineUsersSet.add(userId);
    }

    setContactOffline(userId: string) {
        this.logger.debug(`New contact offline: ${userId}`);
        this.onlineUsersSet.delete(userId);
    }

    // Method to send a message to a specific user using their room
    prepareSendMessage(userId: string) {
        return this.server.to(userId);
    }

    isUserOnline(userId: string) {
        return this.onlineUsersSet.has(userId);
    }
}
