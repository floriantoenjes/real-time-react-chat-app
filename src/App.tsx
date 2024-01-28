import React from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Login } from "./login/Login";
import { Dashboard } from "./dashboard/Dashboard";

function App() {
    return (
        <Routes>
            <Route path="/" element={Login()} />
            <Route path="/dashboard" element={Dashboard()} />
        </Routes>
    );
}

export default App;
