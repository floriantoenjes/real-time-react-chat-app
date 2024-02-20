import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Login } from "./login/Login";
import { Dashboard } from "./dashboard/Dashboard";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "./shared/contexts/SocketContext";
import { UserContext } from "./shared/contexts/UserContext";
import { BACKEND_URL, LOCAL_STORAGE_AUTH_KEY } from "./environment";
import { UserService } from "./shared/services/UserService";
import { User } from "real-time-chat-backend/shared/user.contract";
import { AuthService } from "./shared/services/AuthService";
import { Register } from "./register/Register";

let setUserTest;

function App() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User>();
    const [socket, setSocket] = useState<Socket>();

    useEffect(() => {
        if (user?.username) {
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
    }, [user?.username]);

    if (!user && !!localStorage.getItem(LOCAL_STORAGE_AUTH_KEY)) {
        AuthService.signIn(
            localStorage.getItem(LOCAL_STORAGE_AUTH_KEY) + "@email.com",
            "password",
            new UserService(),
        ).then((user) => {
            if (user && setUserTest) {
                setUserTest(setUser)(user);
            }
        });
    }

    const av = useRef("");

    if (!setUserTest) {
        setUserTest = (stUser) => (user) => {
            new UserService().loadAvatar(user._id).then((bytes) => {
                console.log(user);
                av.current = bytes;
                stUser({ ...user, avatarBase64: av });
                console.log(user);
            });
        };
    }

    useEffect(() => {
        if (user?._id) {
            navigate("/dashboard");
        }
    }, [user]);

    return (
        <UserContext.Provider
            value={[user, setUserTest(setUser), new UserService()]}
        >
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
