import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { RealTimeChatGateway } from './gateways/socket.gateway';
import { Public } from './services/auth-constants';

@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly gateway: RealTimeChatGateway,
    ) {}

    @Get()
    @Public()
    frontendRedirect(@Res() res) {
        return res.redirect('/frontend');
    }

    @Get('ready')
    @Public()
    isReady(): boolean {
        return true;
    }
}
