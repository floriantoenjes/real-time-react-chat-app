export const BACKEND_URL = import.meta.env.PROD ? "" : "http://localhost:4200";

export const PEERJS_SERVER_HOST = import.meta.env.PROD ? "" : "localhost";
export const PEERJS_SERVER_PORT = import.meta.env.PROD ? "443" : "9000";

export const TURN_SERVER_URL = "";
export const TURN_SERVER_USERNAME = "";
export const TURN_SERVER_PASSWORD = "";

export const LOCAL_STORAGE_AUTH_KEY = "signedIn";
