import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Request): Promise<string> {
        const user = req['user'];

        if (user?.sub) {
            return `user:${user.sub}`;
        }

        const ip = this.getClientIp(req);
        return `ip:${ip}`;
    }

    private getClientIp(req: Request): string {
        const forwardedFor = req.headers['x-forwarded-for'];

        if (forwardedFor) {
            const ips = Array.isArray(forwardedFor)
                ? forwardedFor[0]
                : forwardedFor.split(',')[0];
            return ips.trim();
        }

        return req.ip || req.socket.remoteAddress || 'unknown';
    }
}
