import { Throttle, SkipThrottle as NestSkipThrottle } from '@nestjs/throttler';

/**
 * Strict rate limit for authentication endpoints.
 * 5 requests per 15 minutes.
 */
export const AuthThrottle = () =>
    Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } });

/**
 * Strict rate limit for sensitive operations.
 * 10 requests per minute.
 */
export const StrictThrottle = () =>
    Throttle({ default: { limit: 10, ttl: 60 * 1000 } });

/**
 * Skip throttling for this route (e.g., health checks).
 */
export const SkipThrottle = () => NestSkipThrottle();
