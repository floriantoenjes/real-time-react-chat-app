import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: true,
})
export class RealTimeChatGateway implements OnGatewayConnection {
  public connectedSocketsMap = new Map<string, Socket>();

  handleConnection(socket: Socket): any {
    this.connectedSocketsMap.set(
      socket.handshake.query.username as string,
      socket,
    );
  }
}
