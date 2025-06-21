export const BACKEND_URL = import.meta.env.PROD ? "" : "http://localhost:4200";

export const PEERJS_SERVER_HOST = import.meta.env.VITE_PEERJS_SERVER_HOST;
export const PEERJS_SERVER_PORT = import.meta.env.VITE_PEERJS_SERVER_PORT;

export const TURN_SERVER_URL = import.meta.env.VITE_TURN_SERVER_URL;
export const TURN_SERVER_USERNAME = import.meta.env.VITE_TURN_SERVER_USERNAME;
export const TURN_SERVER_PASSWORD = import.meta.env.VITE_TURN_SERVER_PASSWORD;
