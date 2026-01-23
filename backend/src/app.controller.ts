import { Controller, Get, Res } from '@nestjs/common';
import { Public } from './constants/auth-constants';
import { SkipThrottle } from './decorators/throttle.decorators';

@Controller()
export class AppController {
    @Get()
    @Public()
    frontendRedirect(@Res() res) {
        return res.redirect('/frontend');
    }

    @Get('ready')
    @Public()
    @SkipThrottle() // TODO: Check later if skipping is okay here
    isReady(): boolean {
        return true;
    }
}
