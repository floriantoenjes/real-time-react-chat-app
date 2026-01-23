export const WS_THROTTLE_CONFIG = {
    // Default limit: 10 connection attempts per 60 seconds per IP
    default: {
        limit: 10,
        ttlMs: 60 * 1000,
    },
    // Strict limit: 3 connection attempts per 5 minutes for suspected abuse
    strict: {
        limit: 3,
        ttlMs: 5 * 60 * 1000,
    },
    // Redis key prefix for throttle tracking
    keyPrefix: 'ws:throttle:',
} as const;
