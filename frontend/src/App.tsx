import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import "./App.css";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Login } from "./login/Login";
import { Dashboard } from "./dashboard/Dashboard";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "./shared/contexts/SocketContext";
import { UserContext } from "./shared/contexts/UserContext";
import { BACKEND_URL, LOCAL_STORAGE_AUTH_KEY } from "./environment";
import { User } from "real-time-chat-backend/shared/user.contract";
import { Register } from "./register/Register";
import { useDiContext } from "./shared/contexts/DiContext";
import { getSetUserWithAvatarBytesOptional } from "./shared/helpers";
import { AuthService } from "./shared/services/AuthService";

function initializeWebSocket<ListenEvents>(
    setSocket: Dispatch<SetStateAction<Socket | undefined>>,
    user: User,
) {
    let interval: NodeJS.Timer;
    console.log(user._id);
    const socket = io(BACKEND_URL, {
        query: { userId: user?._id },
        transports: ["websocket"],
    });
    socket.connect();
    setSocket(socket);

    socket.on("connect", function () {
        console.log("WebSocket connected", socket);
    });

    socket.on("disconnect", function () {
        setSocket(undefined);
        interval = setInterval(() => {
            console.log("WebSocket disconnected. Reconnecting...");
            socket.connect();
            if (socket.connected) {
                setSocket(socket);
                console.log("WebSocket reconnected.");
                clearInterval(interval);
            }
        }, 1000);
    });

    return () => {
        clearInterval(interval);
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
    if (!user && !!localStorage.getItem(LOCAL_STORAGE_AUTH_KEY)) {
        authService
            .refresh()
            .then((user) => {
                if (user) {
                    setUserWithAvatarBytes(setUser)(user);
                    return;
                }

                if (!user) {
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
            navigate("/dashboard");
            return initializeWebSocket(setSocket, user);
        }
    }, [user?._id]);

    function signOut() {
        localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
        navigate("/");
    }

    return (
        <UserContext.Provider value={[user, setUserWithAvatarBytes(setUser)]}>
            <SocketContext.Provider value={[socket, setSocket]}>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/dashboard"
                        element={<Dashboard user={user} />}
                    />
                </Routes>
            </SocketContext.Provider>
        </UserContext.Provider>
    );
}

export default App;
