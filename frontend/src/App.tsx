import React from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Login } from "./login/Login";
import { Dashboard } from "./dashboard/Dashboard";
import { UserProvider } from "./shared/contexts/UserContext";
import { Register } from "./register/Register";
import { RoutesEnum } from "./shared/enums/routes";
import { SnackbarProvider } from "./shared/contexts/SnackbarContext";
import { SnackbarWrapper } from "./shared/components/SnackbarComponent";
import TypesafeI18n from "./i18n/i18n-react";
import { SocketProvider } from "./shared/contexts/SocketContext";
import { GlobalErrorHandlerContext } from "./shared/contexts/GlobalErrorHandlerContext";
import { useI18n } from "./shared/hooks/useI18n";

function App() {
    const { localesLoaded, locale } = useI18n();

    if (!localesLoaded) {
        return null;
    }

    return (
        <TypesafeI18n locale={locale}>
            <GlobalErrorHandlerContext>
                <SnackbarProvider>
                    <UserProvider>
                        <SocketProvider>
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
                                    element={<Dashboard />}
                                />
                            </Routes>
                            <SnackbarWrapper />
                        </SocketProvider>
                    </UserProvider>
                </SnackbarProvider>
            </GlobalErrorHandlerContext>
        </TypesafeI18n>
    );
}

export default App;
