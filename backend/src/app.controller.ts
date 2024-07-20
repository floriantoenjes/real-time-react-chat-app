import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { RealTimeChatGateway } from './socket.gateway';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly gateway: RealTimeChatGateway,
  ) {}
}
