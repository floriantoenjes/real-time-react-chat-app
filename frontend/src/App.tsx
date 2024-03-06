import React, { useEffect, useRef, useState } from "react";
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
import { getSetUserWithAvatarBytes } from "./shared/helpers";

let setUserWithAvatarBytes: any;

function App() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User>();
    const [socket, setSocket] = useState<Socket>();
    const authService = useDiContext().AuthService;
    const userService = useDiContext().UserService;

    useEffect(() => {
        if (user?._id) {
            setSocket(
                io(BACKEND_URL, {
                    query: { userId: user?._id },
                }),
            );
        }

        return () => {
            socket?.disconnect();
            setSocket(undefined);
        };
        // eslint-disable-next-line
    }, [user?._id]);

    useEffect(() => {
        if (!user && !!localStorage.getItem(LOCAL_STORAGE_AUTH_KEY)) {
            authService
                .refresh()
                .then((user) => {
                    if (user && setUserWithAvatarBytes) {
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
    }, [user?._id]);

    const av = useRef("");

    if (!setUserWithAvatarBytes) {
        setUserWithAvatarBytes = getSetUserWithAvatarBytes(userService);
    }

    useEffect(() => {
        if (user?._id) {
            navigate("/dashboard");
        }
    }, [user]);

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
