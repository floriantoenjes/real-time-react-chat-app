import { ErrorTypes } from "@t/enums/errors.enum";

export const errorsDe = {
    GENERAL_001: "Ein Fehler ist aufgetreten",

    AUTH_001: "Diese E-Mail ist schon vergeben",
    AUTH_002: "AUTH_002",
    AUTH_003: "Kein Zugriff",
    AUTH_004: "AUTH_004",

    MESSAGE_001: "MESSAGE_001",

    CONTACT_001: "CONTACT_001",
    CONTACT_002: "CONTACT_002",

    CONTACT_GROUP_001: "CONTACT_GROUP_001",
    CONTACT_GROUP_002: "CONTACT_GROUP_002",
    CONTACT_GROUP_003: "CONTACT_GROUP_003",

    SIGN_IN_001: "E-Mail oder Passwort sind inkorrekt",
    SIGN_IN_002: "SIGN_IN_002",

    SIGN_UP_001: "SIGN_UP_001",
} satisfies ErrorTypes;
