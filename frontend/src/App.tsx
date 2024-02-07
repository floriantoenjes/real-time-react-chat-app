import React, { useEffect, useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Login } from "./login/Login";
import { Dashboard } from "./dashboard/Dashboard";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "./shared/contexts/SocketContext";
import { UserContext } from "./shared/contexts/UserContext";
import { BACKEND_URL } from "./environment";
import { UserService } from "./shared/services/UserService";
import { User } from "real-time-chat-backend/dist/shared/user.contract";

function App() {
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

    return (
        <UserContext.Provider value={[user, setUser, new UserService()]}>
            <SocketContext.Provider value={[socket, setSocket]}>
                <Routes>
                    <Route path="/" element={<Login />} />
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
