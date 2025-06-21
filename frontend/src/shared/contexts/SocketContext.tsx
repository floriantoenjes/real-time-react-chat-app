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

function initializeWebSocket<ListenEvents>(
    setSocket: Dispatch<SetStateAction<Socket | undefined>>,
    user: User,
) {
    // @ts-ignore
    let socketReconnectInterval: NodeJS.Timer;
    // @ts-ignore
    let heartbeatInterval: NodeJS.Timer;

    let missedPings = 0;
    const MAX_MISSED_PINGS = 3;

    const socket = io(BACKEND_URL, {
        query: { userId: user?._id },
        transports: ["websocket"],
    });
    socket.connect();
    setSocket(socket);

    socket.on("connect", function () {
        console.log("WebSocket connected", socket);

        heartbeatInterval = setInterval(() => {
            if (missedPings >= MAX_MISSED_PINGS) {
                socket.disconnect();
            }
            socket.emit("ping");
            missedPings += 1;
        }, 3000);
    });

    socket.on("pong", () => (missedPings = 0));

    socket.on("disconnect", function () {
        clearInterval(heartbeatInterval);
        setSocket(undefined);
        snackbarService.showSnackbar(
            "The connection to the server has been lost. Reconnecting...",
            SnackbarLevels.WARNING,
        );
        socketReconnectInterval = setInterval(() => {
            console.log("WebSocket disconnected. Reconnecting...");
            socket.connect();
            if (socket.connected) {
                setSocket(socket);
                console.log("WebSocket reconnected.");
                clearInterval(socketReconnectInterval);
                snackbarService.showSnackbar(
                    "The connection to the server has been reestablished",
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

    const [socket, setSocket] = useState<Socket>();

    useEffect(() => {
        if (user?._id) {
            navigate(RoutesEnum.DASHBOARD);
            return initializeWebSocket(setSocket, user);
        }
    }, [user?._id]);

    return (
        <SocketContext.Provider value={[socket, setSocket]}>
            {children}
        </SocketContext.Provider>
    );
};
