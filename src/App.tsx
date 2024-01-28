import React, { useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Login } from "./login/Login";
import { Dashboard } from "./dashboard/Dashboard";
import { User } from "./shared/types/User";

function App() {
    const [user, setUser] = useState<User>();

    return (
        <Routes>
            <Route path="/" element={<Login setUser={setUser} />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
        </Routes>
    );
}

export default App;
