import { ExternalErrorTypes } from "@t/enums/errors.enum";

export const errorsEn = {
    EXT_GENERAL_001: "An error occurred",

    EXT_AUTH_001: "This email is already taken",
    EXT_AUTH_002: "Unauthorized",

    EXT_SIGN_IN_001: "Invalid email or password",
} satisfies ExternalErrorTypes;
