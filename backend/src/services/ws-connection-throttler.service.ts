import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { Socket } from 'socket.io';
import {
    WS_MESSAGE_THROTTLE_CONFIG,
    WS_THROTTLE_CONFIG,
} from '../config/ws-throttle.config';

export interface ThrottleResult {
    allowed: boolean;
    retryAfterMs?: number;
    currentCount?: number;
}

@Injectable()
export class WsConnectionThrottlerService implements OnModuleDestroy {
    private readonly logger = new Logger(WsConnectionThrottlerService.name);
    private readonly redisClient: RedisClientType;
    private readonly connectionPromise: Promise<void>;

    constructor() {
        this.redisClient = createClient({
            url:
                process.env.redis ??
                `redis://${process.env.REDIS_HOST ?? 'localhost'}:6379`,
        });

        this.connectionPromise = this.redisClient
            .connect()
            .then(() => {
                this.logger.log('WS Throttler Redis client connected');
            })
            .catch((err) => {
                this.logger.error(
                    'Failed to connect WS Throttler Redis client',
                    err,
                );
            });
    }

    async onModuleDestroy(): Promise<void> {
        await this.redisClient.quit();
    }

    async checkAndTrack(socket: Socket): Promise<ThrottleResult> {
        await this.connectionPromise;

        const clientIp = this.getClientIp(socket);
        const key = `${WS_THROTTLE_CONFIG.keyPrefix}${clientIp}`;
        const { limit, ttlMs } = WS_THROTTLE_CONFIG.default;

        try {
            // Atomic increment - creates key with value 1 if it doesn't exist
            const currentCount = await this.redisClient.incr(key);

            // Set expiration only on first connection attempt (when count is 1)
            if (currentCount === 1) {
                await this.redisClient.pExpire(key, ttlMs);
            }

            if (currentCount > limit) {
                // Get remaining TTL to calculate retry time
                const ttlRemaining = await this.redisClient.pTTL(key);
                const retryAfterMs = ttlRemaining > 0 ? ttlRemaining : ttlMs;

                this.logger.warn(
                    `Connection throttled for IP ${clientIp}: ${currentCount}/${limit} attempts`,
                );

                return {
                    allowed: false,
                    retryAfterMs,
                    currentCount,
                };
            }

            this.logger.debug(
                `Connection allowed for IP ${clientIp}: ${currentCount}/${limit} attempts`,
            );

            return {
                allowed: true,
                currentCount,
            };
        } catch (error) {
            // On Redis error, allow the connection but log the error
            this.logger.error(
                'Redis throttle check failed, allowing connection',
                error,
            );
            return { allowed: true };
        }
    }

    async checkMessageThrottle(
        userId: string,
        messageType: Exclude<
            keyof typeof WS_MESSAGE_THROTTLE_CONFIG,
            'keyPrefix'
        >,
    ): Promise<ThrottleResult> {
        await this.connectionPromise;

        const config = WS_MESSAGE_THROTTLE_CONFIG[messageType];

        const key = `${WS_MESSAGE_THROTTLE_CONFIG.keyPrefix}${messageType}:${userId}`;
        const { limit, ttlMs } = config;
        try {
            // Atomic increment - creates key with value 1 if it doesn't exist
            const currentCount = await this.redisClient.incr(key);

            // Set expiration only on first message (when count is 1)
            if (currentCount === 1) {
                await this.redisClient.pExpire(key, ttlMs);
            }

            if (currentCount > limit) {
                // Get remaining TTL to calculate retry time
                const ttlRemaining = await this.redisClient.pTTL(key);
                const retryAfterMs = ttlRemaining > 0 ? ttlRemaining : ttlMs;

                this.logger.warn(
                    `Message throttled for user ${userId}, type ${messageType}: ${currentCount}/${limit}`,
                );

                return {
                    allowed: false,
                    retryAfterMs,
                    currentCount,
                };
            }

            return {
                allowed: true,
                currentCount,
            };
        } catch (error) {
            // On Redis error, allow the message but log the error
            this.logger.error(
                'Redis message throttle check failed, allowing message',
                error,
            );
            return { allowed: true };
        }
    }

    private getClientIp(socket: Socket): string {
        const handshake = socket.handshake;

        // Check x-forwarded-for header (for proxied connections)
        const forwardedFor = handshake.headers['x-forwarded-for'];
        if (forwardedFor) {
            const ips = Array.isArray(forwardedFor)
                ? forwardedFor[0]
                : forwardedFor.split(',')[0];
            return ips.trim();
        }

        // Fall back to direct connection address
        return handshake.address || 'unknown';
    }
}
