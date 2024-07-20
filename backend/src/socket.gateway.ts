import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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
  server: Server;

  handleConnection(socket: Socket): void {
    // TODO: Check for JWT for security here

    const userId = socket.handshake.query.userId as string;
    console.log(`New connection: ${socket.id} for user: ${userId}`);
    // Join the socket to a room named after the userId
    socket.join(userId);
  }

  handleDisconnect(socket: Socket): void {
    const userId = socket.handshake.query.userId as string;
    console.log(`Client disconnected: ${socket.id} for user: ${userId}`);
    // Leave the room when the socket disconnects
    socket.leave(userId);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): void {
    console.log('Message received in gateway:', payload);
    // Broadcast to all clients
    this.server.emit('message', { text: 'Hello from server' });
  }

  // Method to send a message to a specific user using their room
  prepareSendMessage(userId: string) {
    return this.server.to(userId);
  }
}
