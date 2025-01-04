import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import "./App.css";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Login } from "./login/Login";
import { Dashboard } from "./dashboard/Dashboard";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "./shared/contexts/SocketContext";
import { UserContext } from "./shared/contexts/UserContext";
import {
    BACKEND_URL,
    LOCAL_STORAGE_AUTH_KEY,
    LOCAL_STORAGE_REFRESH_TOKEN,
    PEERJS_SERVER_HOST,
    PEERJS_SERVER_PORT,
    TURN_SERVER_PASSWORD,
    TURN_SERVER_URL,
    TURN_SERVER_USERNAME,
} from "./environment";
import { User } from "real-time-chat-backend/shared/user.contract";
import { Register } from "./register/Register";
import { useDiContext } from "./shared/contexts/DiContext";
import { getSetUserWithAvatarBytesOptional } from "./shared/helpers";
import { AuthService } from "./shared/services/AuthService";
import { PeerContext } from "./shared/contexts/PeerContext";
import Peer, { DataConnection, MediaConnection } from "peerjs";
import { RoutesEnum } from "./shared/enums/routes";
import {
    SnackbarLevels,
    SnackbarProvider,
    snackbarService,
} from "./shared/contexts/SnackbarContext";
import { SnackbarWrapper } from "./shared/components/SnackbarComponent";

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
        auth: {
            Authorization: `Bearer ${localStorage.getItem(LOCAL_STORAGE_AUTH_KEY)}`,
        },
    });
    socket.connect();
    setSocket(socket);

    socket.on("connect", function () {
        snackbarService.showSnackbar(
            "The connection to the server has been reestablished",
            SnackbarLevels.SUCCESS,
        );
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
            socket.auth = {
                Authorization:
                    "Bearer " + localStorage.getItem(LOCAL_STORAGE_AUTH_KEY),
            };
            socket.connect();
            if (socket.connected) {
                setSocket(socket);
                console.log("WebSocket reconnected.");
                clearInterval(socketReconnectInterval);
            }
        }, 1000);
    });

    return () => {
        clearInterval(socketReconnectInterval);
        socket?.disconnect();
        setSocket(undefined);
    };
}

function authenticateUserAndFetchAvatar(
    user: User | undefined,
    authService: AuthService,
    setUserWithAvatarBytes: (
        setUser: React.Dispatch<React.SetStateAction<User | undefined>>,
    ) => (user: React.SetStateAction<User | undefined>) => void,
    setUser: Dispatch<SetStateAction<User | undefined>>,
    signOut: () => void,
) {
    if (
        !user &&
        !!(
            localStorage.getItem(LOCAL_STORAGE_AUTH_KEY) ||
            localStorage.getItem(LOCAL_STORAGE_REFRESH_TOKEN)
        )
    ) {
        authService
            .refresh()
            .then((loggedInUser) => {
                if (loggedInUser) {
                    setUserWithAvatarBytes(setUser)(loggedInUser);
                    return;
                }

                if (!loggedInUser) {
                    signOut();
                }
            })
            .catch(() => {
                signOut();
            });
        return;
    }

    if (user) {
        setUserWithAvatarBytes(setUser)(user);
        return;
    }
}

function App() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User>();
    const [socket, setSocket] = useState<Socket>();

    const authService = useDiContext().AuthService;
    const loggingService = useDiContext().LoggingService;
    const userService = useDiContext().UserService;

    const setUserWithAvatarBytes =
        getSetUserWithAvatarBytesOptional(userService);

    useEffect(() => {
        authenticateUserAndFetchAvatar(
            user,
            authService,
            setUserWithAvatarBytes,
            setUser,
            signOut,
        );

        if (user?._id) {
            navigate(RoutesEnum.DASHBOARD);
            return initializeWebSocket(setSocket, user);
        }
    }, [user?._id]);

    function signOut() {
        AuthService.signOut(() => navigate(RoutesEnum.LOGIN));
    }

    const [calling, setCalling] = useState<boolean>(false);
    const [peer, setPeer] = useState<Peer | null>(null);
    const [connection, setDataConnection] = useState<DataConnection | null>(
        null,
    );
    const [call, setCall] = useState<MediaConnection | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [callingStream, setCallingStream] = useState<MediaStream | null>(
        null,
    );
    const [receiveCallingStream, setReceiveCallingStream] =
        useState<MediaStream | null>(null);

    useEffect(() => {
        if (user && !peer) {
            const newPeer = new Peer(user.username, {
                host: PEERJS_SERVER_HOST,
                port: +PEERJS_SERVER_PORT,
                path: "/peerjs/myapp",
                config: {
                    iceServers: [
                        // { url: "stun:stun.l.google.com:19302" }, // Public STUN server for initial connection
                        {
                            url: TURN_SERVER_URL,
                            username: TURN_SERVER_USERNAME,
                            credential: TURN_SERVER_PASSWORD,
                        },
                    ],
                    iceTransportPolicy: "relay",
                },
            });
            setPeer(newPeer);

            newPeer.on("open", (id) => {
                loggingService.log(`User ${user._id} received Peer-Id: ${id}`);
            });

            newPeer.on("error", (err) => {
                loggingService.error(
                    `User ${user._id} received Error: ${err}`,
                    undefined,
                    err?.stack,
                );
            });
        }
    }, [user?.username]);

    useEffect(() => {
        const internalFetchErrorMessageToBeIgnored = "Failed to fetch";

        window.onerror = function (message, source, lineno, colno, error) {
            if (
                error &&
                error.message.includes(internalFetchErrorMessageToBeIgnored)
            ) {
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
                    .includes(internalFetchErrorMessageToBeIgnored)
            ) {
                return;
            }
            loggingService.error(
                `Unhandled Promise Rejection: ${event.reason}`,
                "Unhandled Promise",
                event.reason?.stack || null,
            );
        };
    }, []);

    return (
        <SnackbarProvider>
            <UserContext.Provider
                value={[user, setUserWithAvatarBytes(setUser)]}
            >
                <SocketContext.Provider value={[socket, setSocket]}>
                    <PeerContext.Provider
                        value={{
                            calling,
                            setCalling,
                            callingStream,
                            setCallingStream,
                            peer,
                            setPeer,
                            connection,
                            setDataConnection,
                            call,
                            setCall,
                            stream,
                            setStream,
                            receiveCallingStream,
                            setReceiveCallingStream,
                        }}
                    >
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
                    </PeerContext.Provider>
                </SocketContext.Provider>
            </UserContext.Provider>
        </SnackbarProvider>
    );
}

export default App;
