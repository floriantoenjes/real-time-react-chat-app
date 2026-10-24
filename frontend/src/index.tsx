import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router";
import * as Sentry from "@sentry/browser";

Sentry.init({
    dsn: "https://c5761411d2f94e1bb3a75428c4da214f@glitchtip.floriantoenjes.com/2",
});

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement,
);
root.render(
    <React.StrictMode>
        <BrowserRouter basename={"/frontend/"}>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
);
