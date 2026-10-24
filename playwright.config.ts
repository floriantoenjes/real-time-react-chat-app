import { defineConfig, devices } from "@playwright/test";
import {
    BACKEND_URL,
    FRONTEND_ORIGIN,
    FRONTEND_URL,
    USE_FRONTEND_BUILD,
} from "./e2e/support/urls";

const isCI = !!process.env.CI;
const allBrowsers = !!process.env.E2E_ALL_BROWSERS;

export default defineConfig({
    testDir: "e2e/tests",
    globalSetup: "./e2e/support/global-setup.ts",
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 4 : undefined,
    reporter: isCI ? [["list"], ["html", { open: "never" }]] : "html",
    use: {
        baseURL: FRONTEND_URL,
        // Force English; the i18n spec switches the language explicitly.
        storageState: {
            cookies: [],
            origins: [
                {
                    origin: FRONTEND_ORIGIN,
                    localStorage: [{ name: "language", value: "en" }],
                },
            ],
        },
        trace: "on-first-retry",
        video: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            testIgnore: /responsive\//,
            use: {
                ...devices["Desktop Chrome"],
                permissions: ["microphone"],
                launchOptions: {
                    args: [
                        "--use-fake-ui-for-media-stream",
                        "--use-fake-device-for-media-stream",
                    ],
                },
            },
        },
        {
            name: "mobile-chromium",
            testMatch: /responsive\/.*\.spec\.ts/,
            use: { ...devices["Pixel 7"] },
        },
        ...(allBrowsers
            ? [
                  {
                      name: "firefox",
                      testIgnore: /responsive\//,
                      grepInvert: /@chromium-only/,
                      use: { ...devices["Desktop Firefox"] },
                  },
              ]
            : []),
    ],
    webServer: [
        {
            // With USE_FRONTEND_BUILD the backend serves frontend/dist at /frontend, so a
            // page load fetches a few bundled files instead of thousands of dev modules.
            command: USE_FRONTEND_BUILD
                ? "npm --prefix ../frontend run build && npx nest start"
                : "npx nest start",
            cwd: "backend",
            // All test users share one IP, so the production rate limits would trip.
            // 1000 leaves room for --repeat-each and parallel workers (~5 auth calls per
            // test against 5/15min). When reusing a running backend, start it with this
            // env var as well.
            env: { E2E_THROTTLE_MULTIPLIER: "1000" },
            url: `${BACKEND_URL}/ready`,
            // A reused backend might serve a stale or missing frontend build.
            reuseExistingServer: !isCI && !USE_FRONTEND_BUILD,
            timeout: 120_000,
            stdout: "ignore",
            stderr: "pipe",
        },
        ...(USE_FRONTEND_BUILD
            ? []
            : [
                  {
                      command: "npx vite --port 5173 --strictPort",
                      cwd: "frontend",
                      url: FRONTEND_URL,
                      reuseExistingServer: !isCI,
                      timeout: 60_000,
                  },
              ]),
    ],
});
