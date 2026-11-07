export const BACKEND_URL = import.meta.env.PROD ? "" : "http://localhost:4200";

export const PEERJS_SERVER_HOST = import.meta.env.VITE_PEERJS_SERVER_HOST;
export const PEERJS_SERVER_PORT = import.meta.env.VITE_PEERJS_SERVER_PORT;

export const TURN_SERVER_URL = import.meta.env.VITE_TURN_SERVER_URL;

/** Shows hints for visitors of the public demo deployment (set at build time). */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
