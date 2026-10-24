// In CI (or with E2E_PREVIEW=1) the backend serves the production frontend build
// itself, as in the Docker image, instead of running the Vite dev server.
export const USE_FRONTEND_BUILD = !!process.env.CI || !!process.env.E2E_PREVIEW;

export const BACKEND_URL = "http://localhost:4200";
export const FRONTEND_ORIGIN = USE_FRONTEND_BUILD
    ? BACKEND_URL
    : "http://localhost:5173";
export const FRONTEND_URL = `${FRONTEND_ORIGIN}/frontend/`;
