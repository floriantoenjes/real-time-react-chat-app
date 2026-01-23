import React, {
    createContext,
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { User } from "@t/user.contract";
import { BACKEND_URL } from "../../environment";
import { SnackbarLevels, snackbarService } from "./SnackbarContext";
import { RoutesEnum } from "../enums/routes";
import { UserContext } from "./UserContext";
import { useNavigate } from "react-router-dom";
import { useI18nContext } from "../../i18n/i18n-react";
import { TranslationFunctions } from "../../i18n/i18n-types";
import { SocketMessageTypes } from "@t/socket-message-types.enum";
import { ExternalErrors } from "@t/enums/errors.enum";

function initializeWebSocket(
    setSocket: Dispatch<SetStateAction<Socket | undefined>>,
    user: User,
    LL: TranslationFunctions,
) {
    // @ts-ignore
    let socketReconnectInterval: NodeJS.Timer;
    // @ts-ignore
    let heartbeatInterval: NodeJS.Timer;

    let missedPings = 0;
    const MAX_MISSED_PINGS = 3;

    let throttled = false;

    const socket = io(BACKEND_URL, {
        query: { userId: user?._id },
        transports: ["websocket"],
    });
    socket.connect();
    setSocket(socket);

    socket.on(
        "error",
        (error: {
            error: string;
            errorCode: ExternalErrors;
            message: string;
            retryAfterMs: number;
        }) => {
            if (error.errorCode === ExternalErrors.EXT_WS_THROTTLE_001) {
                throttled = true;

                setTimeout(() => {
                    throttled = false;
                }, error.retryAfterMs + 1000);
            }
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
            return initializeWebSocket(setSocket, user, LL);
        }
    }, [user?._id]);

    return (
        <SocketContext.Provider value={[socket, setSocket]}>
            {children}
        </SocketContext.Provider>
    );
};
