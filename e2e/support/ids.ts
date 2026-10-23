import { randomBytes } from "node:crypto";

// Usernames are limited to 15 characters by the auth contract.
const USERNAME_MAX_LENGTH = 15;
const SUFFIX_LENGTH = 6;

function randomSuffix(): string {
    return randomBytes(8)
        .toString("hex")
        .replace(/^0+/, "")
        .slice(0, SUFFIX_LENGTH);
}

/**
 * Unique, alphanumeric username, e.g. `Alice3f9a1c`. Alphanumeric because the
 * contact list filter treats the input as a regex.
 */
export function uniqueUsername(prefix = "User"): string {
    const safePrefix = prefix
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, USERNAME_MAX_LENGTH - SUFFIX_LENGTH);
    return `${safePrefix}${randomSuffix()}`;
}

export function uniqueEmail(username: string): string {
    return `${username.toLowerCase()}@e2e.test`;
}

export const DEFAULT_PASSWORD = "e2e-Password-123!";
