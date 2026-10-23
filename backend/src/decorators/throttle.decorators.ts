import { SkipThrottle as NestSkipThrottle, Throttle } from '@nestjs/throttler';
import { scaleLimit } from '../config/throttle-multiplier.config';

export const AuthThrottle = () =>
    Throttle({ default: { limit: scaleLimit(5), ttl: 15 * 60 * 1000 } });

export const StrictThrottle = () =>
    Throttle({ default: { limit: scaleLimit(20), ttl: 60 * 1000 } });

/**
 * Skip throttling for this route (e.g., health checks).
 */
export const SkipThrottle = () => NestSkipThrottle();
