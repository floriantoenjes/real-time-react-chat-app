import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RealTimeChatGateway } from './socket.gateway';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly gateway: RealTimeChatGateway,
  ) {}

  @Get()
  getHello(): string {
    this.gateway.connectedSocketsMap
      .get('florian')
      .emit('message', 'Hello world!');
    return this.appService.getHello();
  }
}
