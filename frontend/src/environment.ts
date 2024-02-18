export const BACKEND_URL = import.meta.env.PROD
    ? "https://florians-realtime-chat-s4k74.ondigitalocean.app"
    : "http://localhost:4200";

export const LOCAL_STORAGE_AUTH_KEY = "signedIn";
