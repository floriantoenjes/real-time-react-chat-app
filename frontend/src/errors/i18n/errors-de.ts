import { ExternalErrorTypes } from "@t/enums/errors.enum";

export const errorsDe = {
    EXT_GENERAL_001: "Ein Fehler ist aufgetreten",

    EXT_AUTH_001: "Diese E-Mail ist schon vergeben",
    EXT_AUTH_002: "Kein Zugriff",

    EXT_SIGN_IN_001: "E-Mail oder Passwort sind inkorrekt",

    EXT_RATE_LIMIT_001: "Zu viele Anfragen in kurzer Zeit",

    EXT_WS_THROTTLE_001: "Zu viele Anfragen in kurzer Zeit",

    EXT_FILE_001: "Datei zu groß",
    EXT_FILE_002: "Datei-Typ ungültig",

    EXT_IGNORE_001: "Sie können sich selbst nicht ignorieren",
    EXT_IGNORE_002: "Dieser Benutzer wird bereits ignoriert",
    EXT_IGNORE_003: "Dieser Benutzer wird nicht ignoriert",
    EXT_IGNORE_004: "Sie können nicht mit einem ignorierten Benutzer interagieren",
} satisfies ExternalErrorTypes;
