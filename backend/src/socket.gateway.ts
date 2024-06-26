import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: true,
})
export class RealTimeChatGateway implements OnGatewayConnection {
  public connectedSocketsMap = new Map<string, Socket>();

  handleConnection(socket: Socket): any {
    console.log(socket.id);
    this.connectedSocketsMap.set(
      socket.handshake.query.userId as string,
      socket,
    );
  }
}
