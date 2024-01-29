import React, { useEffect, useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Login } from "./login/Login";
import { Dashboard } from "./dashboard/Dashboard";
import { User } from "./shared/types/User";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "./shared/contexts/SocketContext";

function App() {
    const [user, setUser] = useState<User>();

    const [socket, setSocket] = useState<Socket>();

    useEffect(() => {
        if (!socket && user?.username) {
            setSocket(
                io("http://localhost:4200", {
                    query: { username: user?.username.toLowerCase() },
                }),
            );
        }
    }, [socket, user?.username]);

    return (
        <SocketContext.Provider value={[socket, setSocket]}>
            <Routes>
                <Route path="/" element={<Login setUser={setUser} />} />
                <Route path="/dashboard" element={<Dashboard user={user} />} />
            </Routes>
        </SocketContext.Provider>
    );
}

export default App;
