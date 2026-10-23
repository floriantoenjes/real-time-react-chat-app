/**
 * Scales every rate limit (REST + WebSocket). Only meant for the Playwright e2e
 * suite, where many test users connect from the same IP within seconds.
 *
 * Read from the process environment at import time (not from .env), so it has to
 * be set explicitly when starting the backend. Defaults to 1 (production limits).
 */
function parseMultiplier(value: string | undefined): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export const THROTTLE_LIMIT_MULTIPLIER = parseMultiplier(
    process.env.E2E_THROTTLE_MULTIPLIER,
);

export const scaleLimit = (limit: number): number =>
    limit * THROTTLE_LIMIT_MULTIPLIER;
