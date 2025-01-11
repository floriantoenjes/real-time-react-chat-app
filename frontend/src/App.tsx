import React, { useEffect, useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Login } from "./login/Login";
import { Dashboard } from "./dashboard/Dashboard";
import { UserContext } from "./shared/contexts/UserContext";
import { User } from "real-time-chat-backend/shared/user.contract";
import { Register } from "./register/Register";
import { useDiContext } from "./shared/contexts/DiContext";
import { getSetUserWithAvatarBytesOptional } from "./shared/helpers";
import { PeerProvider } from "./shared/contexts/PeerContext";
import { RoutesEnum } from "./shared/enums/routes";
import {
    SnackbarProvider,
    snackbarService,
} from "./shared/contexts/SnackbarContext";
import { SnackbarWrapper } from "./shared/components/SnackbarComponent";
import { detectLocale, navigatorDetector } from "typesafe-i18n/detectors";
import { loadLocaleAsync } from "./i18n/i18n-util.async";
import TypesafeI18n from "./i18n/i18n-react";
import { SocketProvider } from "./shared/contexts/SocketContext";

function App() {
    const locale = detectLocale("en", ["en"], navigatorDetector);
    const [localesLoaded, setLocalesLoaded] = useState(false);
    const [user, setUser] = useState<User>();

    const authService = useDiContext().AuthService;
    const loggingService = useDiContext().LoggingService;
    const userService = useDiContext().UserService;

    const setUserWithAvatarBytes =
        getSetUserWithAvatarBytesOptional(userService);

    useEffect(() => {
        loadLocaleAsync(locale).then(() => setLocalesLoaded(true));
    }, [locale]);

    useEffect(() => {
        void authService.authenticateUserAndFetchAvatar(
            user,
            setUserWithAvatarBytes,
            setUser,
        );
    }, [user?._id]);

    useEffect(() => {
        const internalFetchErrorMessageToBeIgnored = "Failed to fetch";

        window.onerror = function (message, source, lineno, colno, error) {
            if (
                error &&
                (error.message.includes(internalFetchErrorMessageToBeIgnored) ||
                    error.message.includes("NetworkError"))
            ) {
                snackbarService.showSnackbar("You seem to be offline.");
                return;
            }
            loggingService.error(
                `Uncaught Exception: ${message}`,
                source,
                error?.stack,
            );
        };

        window.onunhandledrejection = function (event) {
            if (
                event.reason
                    .toString()
                    .includes(internalFetchErrorMessageToBeIgnored) ||
                event.reason.toString().includes("NetworkError")
            ) {
                snackbarService.showSnackbar("You seem to be offline.");
                return;
            }
            loggingService.error(
                `Unhandled Promise Rejection: ${event.reason}`,
                "Unhandled Promise",
                event.reason?.stack || null,
            );
        };
    }, []);

    if (!localesLoaded) {
        return null;
    }

    return (
        <TypesafeI18n locale={locale}>
            <SnackbarProvider>
                <UserContext.Provider
                    value={[user, setUserWithAvatarBytes(setUser)]}
                >
                    <SocketProvider>
                        <PeerProvider>
                            <Routes>
                                <Route
                                    path={RoutesEnum.LOGIN}
                                    element={<Login />}
                                />
                                <Route
                                    path={RoutesEnum.REGISTER}
                                    element={<Register />}
                                />
                                <Route
                                    path={RoutesEnum.DASHBOARD}
                                    element={<Dashboard user={user} />}
                                />
                            </Routes>
                            <SnackbarWrapper />
                        </PeerProvider>
                    </SocketProvider>
                </UserContext.Provider>
            </SnackbarProvider>
        </TypesafeI18n>
    );
}

export default App;
