export const BACKEND_URL = import.meta.env.PROD ? "" : "http://localhost:4200";

export const PEERJS_SERVER_HOST = import.meta.env.PROD
    ? "peer.example.com"
    : "localhost";
export const PEERJS_SERVER_PORT = import.meta.env.PROD ? "443" : "9000";

export const TURN_SERVER_URL = "turns:turn.example.com";

/** Shows hints for visitors of the public demo deployment (set at build time). */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
