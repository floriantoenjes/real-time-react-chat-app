import { ExternalErrorTypes } from "@t/enums/errors.enum";

export const errorsEn = {
    EXT_GENERAL_001: "An error occurred",

    EXT_AUTH_001: "This email is already taken",
    EXT_AUTH_002: "Unauthorized",

    EXT_SIGN_IN_001: "Invalid email or password",

    EXT_RATE_LIMIT_001: "Too many requests in a short period of time",

    EXT_WS_THROTTLE_001: "Too many requests in a short period of time",

    EXT_FILE_001: "File too large",
    EXT_FILE_002: "Invalid file type",
} satisfies ExternalErrorTypes;
