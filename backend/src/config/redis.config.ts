/**
 * Redis connection URL shared by every Redis client (socket.io adapter, pub/sub,
 * cache, WS throttler). Prefers the full `redis` URL and falls back to
 * REDIS_HOST on the default port, so setting either one is enough.
 *
 * A function rather than a constant so it is read after ConfigModule has loaded .env.
 */
export const getRedisUrl = (): string =>
    process.env.redis ??
    `redis://${process.env.REDIS_HOST ?? 'localhost'}:6379`;
