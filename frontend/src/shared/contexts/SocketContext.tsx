import React, {
    createContext,
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "../../environment";
import { SnackbarLevels, snackbarService } from "./SnackbarContext";
import { RoutesEnum } from "../enums/routes";
import { UserContext } from "./UserContext";
import { useNavigate } from "react-router";
import { useI18nContext } from "../../i18n/i18n-react";
import { TranslationFunctions } from "../../i18n/i18n-types";
import { SocketMessageTypes } from "@t/socket-message-types.enum";
import { ExternalErrors } from "@t/enums/errors.enum";
import { SocketConnectErrorData } from "@t/socket-connect-error";

function initializeWebSocket(
    setSocket: Dispatch<SetStateAction<Socket | undefined>>,
    LL: TranslationFunctions,
) {
    let socketReconnectInterval: ReturnType<typeof setInterval>;
    let heartbeatInterval: ReturnType<typeof setInterval>;
    let throttleTimeout: ReturnType<typeof setTimeout> | undefined;

    let missedPings = 0;
    const MAX_MISSED_PINGS = 3;

    let throttled = false;

    const socket = io(BACKEND_URL, {
        transports: ["websocket"],
    });
    socket.connect();
    setSocket(socket);

    // The server rejects throttled and unauthenticated connections in its
    // connection middleware; the client then gets a connect_error
    socket.on(
        "connect_error",
        (error: Error & { data?: SocketConnectErrorData }) => {
            if (error.data?.errorCode !== ExternalErrors.EXT_WS_THROTTLE_001) {
                // Socket.IO retries on its own with backoff
                return;
            }

            throttled = true;
            // Pause Socket.IO's own reconnection as well until the window is over
            socket.io.reconnection(false);
            clearTimeout(throttleTimeout);
            throttleTimeout = setTimeout(
                () => {
                    throttled = false;
                    socket.io.reconnection(true);
                    socket.connect();
                },
                (error.data.retryAfterMs ?? 60000) + 1000,
            );
        },
    );

    socket.on("connect", function () {
        heartbeatInterval = setInterval(() => {
            if (missedPings >= MAX_MISSED_PINGS) {
                socket.disconnect();
            }
            socket.emit(SocketMessageTypes.ping);
            missedPings += 1;
        }, 3000);
    });

    socket.on(SocketMessageTypes.pong, () => (missedPings = 0));

    socket.on("disconnect", function () {
        clearInterval(heartbeatInterval);
        setSocket(undefined);
        snackbarService.showSnackbar(
            LL.WS_CONNECTION_LOST(),
            SnackbarLevels.WARNING,
        );
        clearInterval(socketReconnectInterval);
        socketReconnectInterval = setInterval(() => {
            if (throttled) {
                return;
            }

            socket.connect();
            if (socket.connected) {
                setSocket(socket);
                clearInterval(socketReconnectInterval);
                snackbarService.showSnackbar(
                    LL.WS_CONNECTION_REESTABLISHED(),
                    SnackbarLevels.SUCCESS,
                );
            }
        }, 1000);
    });

    return () => {
        clearInterval(socketReconnectInterval);
        clearTimeout(throttleTimeout);
        socket?.disconnect();
        setSocket(undefined);
    };
}

export const SocketContext = createContext<
    [Socket | undefined, Dispatch<SetStateAction<Socket | undefined>>]
>([undefined, () => {}]);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const [user] = useContext(UserContext);
    const { LL } = useI18nContext();

    const [socket, setSocket] = useState<Socket>();

    useEffect(() => {
        if (user?._id) {
            navigate(RoutesEnum.DASHBOARD);
            return initializeWebSocket(setSocket, LL);
        }
    }, [user?._id]);

    return (
        <SocketContext.Provider value={[socket, setSocket]}>
            {children}
        </SocketContext.Provider>
    );
};
