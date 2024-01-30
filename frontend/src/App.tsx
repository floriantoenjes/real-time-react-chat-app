import React, { useEffect, useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Login } from "./login/Login";
import { Dashboard } from "./dashboard/Dashboard";
import { User } from "./shared/types/User";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "./shared/contexts/SocketContext";
import { UserContext } from "./shared/contexts/UserContext";
import { BACKEND_URL } from "./environment";

function App() {
    const [user, setUser] = useState<User>();

    const [socket, setSocket] = useState<Socket>();

    useEffect(() => {
        if (user?.username) {
            setSocket(
                io(BACKEND_URL, {
                    query: { username: user?.username.toLowerCase() },
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
        <UserContext.Provider value={[user, setUser]}>
            <SocketContext.Provider value={[socket, setSocket]}>
                <Routes>
                    <Route path="/" element={<Login setUser={setUser} />} />
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
