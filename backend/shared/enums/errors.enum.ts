export enum InternalErrors {
    AUTH_001 = 'AUTH_001',
    AUTH_002 = 'AUTH_002',

    MESSAGE_001 = 'MESSAGE_001',

    CONTACT_001 = 'CONTACT_001',
    CONTACT_002 = 'CONTACT_002',

    CONTACT_GROUP_001 = 'CONTACT_GROUP_001',
    CONTACT_GROUP_002 = 'CONTACT_GROUP_002',
    CONTACT_GROUP_003 = 'CONTACT_GROUP_003',
    CONTACT_GROUP_004 = 'CONTACT_GROUP_004',
}

export enum ExternalErrors {
    EXT_GENERAL_001 = 'EXT_GENERAL_001',

    EXT_AUTH_001 = 'EXT_AUTH_001',
    EXT_AUTH_002 = 'EXT_AUTH_002',

    EXT_SIGN_IN_001 = 'EXT_SIGN_IN_001',

    EXT_RATE_LIMIT_001 = 'EXT_RATE_LIMIT_001',

    EXT_WS_THROTTLE_001 = 'EXT_WS_THROTTLE_001',
}

export type InternalErrorTypes = Record<InternalErrors, string>;
export type ExternalErrorTypes = Record<ExternalErrors, string>;
