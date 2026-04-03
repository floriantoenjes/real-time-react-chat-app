import { loadLocaleAsync } from "../../i18n/i18n-util.async";
import { useEffect, useState } from "react";
import { detectLocale, navigatorDetector } from "typesafe-i18n/detectors";

export function useI18n() {
    const locale =
        (localStorage.getItem("language") as "en" | "de") ??
        detectLocale("en", ["en", "de"], navigatorDetector);
    const [localesLoaded, setLocalesLoaded] = useState(false);

    useEffect(() => {
        loadLocaleAsync(locale).then(() => setLocalesLoaded(true));
    }, [locale]);

    return { localesLoaded, locale };
}
