import { errorsDe } from "./errors-de";
import { errorsEn } from "./errors-en";

export function getErrorTranslation(
    errorCode: string,
    locale: "de" | "en",
): string {
    if (locale === "en") {
        return errorsEn[errorCode as keyof typeof errorsEn];
    } else if (locale === "de") {
        return errorsDe[errorCode as keyof typeof errorsDe];
    }
    return "Unknown error";
}
