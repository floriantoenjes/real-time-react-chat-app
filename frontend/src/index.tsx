import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/browser";

Sentry.init({
    dsn: "https://887d1ee796b4450e82f364a5a81d9f0a@glitchtip.floriantoenjes.com/3",
    // dsn: "https://887d1ee796b4450e82f364a5a81d9f0a@glitchtip/3",
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
