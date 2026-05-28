export enum InternalErrors {
    // Authentication errors
    AUTH_001 = 'AUTH_001', // User not found
    AUTH_002 = 'AUTH_002', // Object not found

    // Message errors
    MESSAGE_001 = 'MESSAGE_001', // Message not found

    // Contact errors
    CONTACT_001 = 'CONTACT_001', // Contact not found
    CONTACT_002 = 'CONTACT_002', // Contact already exists
    CONTACT_003 = 'CONTACT_003', // Contact not accepted

    // Contact group errors
    CONTACT_GROUP_001 = 'CONTACT_GROUP_001', // No contact group members found
    CONTACT_GROUP_002 = 'CONTACT_GROUP_002', // Contact group already exists
    CONTACT_GROUP_003 = 'CONTACT_GROUP_003', // Contact group not found
    CONTACT_GROUP_004 = 'CONTACT_GROUP_004', // User is not a member of this group
}

export enum ExternalErrors {
    // General errors
    EXT_GENERAL_001 = 'EXT_GENERAL_001', // Operation failed

    // Authentication errors
    EXT_AUTH_001 = 'EXT_AUTH_001', // Email already taken
    EXT_AUTH_002 = 'EXT_AUTH_002', // Unauthorized

    // Sign in errors
    EXT_SIGN_IN_001 = 'EXT_SIGN_IN_001', // Invalid email or password

    // Rate limiting errors
    EXT_RATE_LIMIT_001 = 'EXT_RATE_LIMIT_001', // Too many requests

    // WebSocket errors
    EXT_WS_THROTTLE_001 = 'EXT_WS_THROTTLE_001', // WebSocket connection throttled

    // File errors
    EXT_FILE_001 = 'EXT_FILE_001', // File too large
    EXT_FILE_002 = 'EXT_FILE_002', // Invalid file type

    // Ignore feature errors
    EXT_IGNORE_001 = 'EXT_IGNORE_001', // You cannot ignore yourself
    EXT_IGNORE_002 = 'EXT_IGNORE_002', // This user is already ignored
    EXT_IGNORE_003 = 'EXT_IGNORE_003', // This user is not ignored
    EXT_IGNORE_004 = 'EXT_IGNORE_004', // You cannot interact with a user you have ignored
}

export type InternalErrorTypes = Record<InternalErrors, string>;
export type ExternalErrorTypes = Record<ExternalErrors, string>;
