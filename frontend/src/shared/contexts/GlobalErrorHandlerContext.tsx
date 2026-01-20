import { useEffect } from "react";
import { snackbarService } from "./SnackbarContext";
import { useDiContext } from "./DiContext";
import { useI18nContext } from "../../i18n/i18n-react";
import * as Sentry from "@sentry/browser";

export const GlobalErrorHandlerContext = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const { LL } = useI18nContext();
    const loggingService = useDiContext().LoggingService;

    useEffect(() => {
        const internalFetchErrorMessageToBeIgnored = "Failed to fetch";
        const internalNetworkErrorMessageToBeIgnored = "NetworkError";

        window.onerror = function (message, source, lineno, colno, error) {
            if (
                error?.message.includes(internalFetchErrorMessageToBeIgnored) ||
                error?.message.includes(internalNetworkErrorMessageToBeIgnored)
            ) {
                snackbarService.showSnackbar(LL.OFFLINE_HINT());
                return;
            }
            // loggingService.error(
            //     `Uncaught Exception: ${message}`,
            //     source,
            //     error?.stack,
            // );
            Sentry.captureException(error);
        };

        window.onunhandledrejection = function (event) {
            if (
                event.reason
                    .toString()
                    .includes(internalFetchErrorMessageToBeIgnored) ||
                event.reason
                    .toString()
                    .includes(internalNetworkErrorMessageToBeIgnored)
            ) {
                snackbarService.showSnackbar(LL.OFFLINE_HINT());
                return;
            }
            // loggingService.error(
            //     `Unhandled Promise Rejection: ${event.reason}`,
            //     "Unhandled Promise",
            //     event.reason?.stack || null,
            // );
            Sentry.captureException(event.reason);
        };
    }, []);

    return <>{children}</>;
};
