// TODO: differentiate between internal and external errors here
export enum Errors {
    GENERAL_001 = 'GENERAL_001',

    AUTH_001 = 'AUTH_001',
    AUTH_002 = 'AUTH_002',
    AUTH_003 = 'AUTH_003',
    AUTH_004 = 'AUTH_004',

    MESSAGE_001 = 'MESSAGE_001',

    CONTACT_001 = 'CONTACT_001',
    CONTACT_002 = 'CONTACT_002',

    CONTACT_GROUP_001 = 'CONTACT_GROUP_001',
    CONTACT_GROUP_002 = 'CONTACT_GROUP_002',
    CONTACT_GROUP_003 = 'CONTACT_GROUP_003',

    SIGN_IN_001 = 'SIGN_IN_001',
    SIGN_IN_002 = 'SIGN_IN_002',

    SIGN_UP_001 = 'SIGN_UP_001',
}

export type ErrorTypes = Record<Errors, string>;
