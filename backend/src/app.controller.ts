import { Controller, Get, Res } from '@nestjs/common';
import { Public } from './services/auth-constants';
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

    @Get('/debug-sentry')
    mainHandler() {
        throw new Error('My first GlitchTip error!');
    }
}
