import { ErrorTypes } from "@t/enums/errors.enum";

export const errorsEn = {
    GENERAL_001: "An error occurred",

    AUTH_001: "This email is already taken",
    AUTH_002: "AUTH_002",
    AUTH_003: "Unauthorized",
    AUTH_004: "AUTH_004",

    MESSAGE_001: "MESSAGE_001",

    CONTACT_001: "CONTACT_001",
    CONTACT_002: "CONTACT_002",

    CONTACT_GROUP_001: "CONTACT_GROUP_001",
    CONTACT_GROUP_002: "CONTACT_GROUP_002",
    CONTACT_GROUP_003: "CONTACT_GROUP_003",

    SIGN_IN_001: "Invalid email or password",
    SIGN_IN_002: "SIGN_IN_002",

    SIGN_UP_001: "SIGN_UP_001",
} satisfies ErrorTypes;
