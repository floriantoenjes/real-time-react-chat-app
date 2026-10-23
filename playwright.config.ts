import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const allBrowsers = !!process.env.E2E_ALL_BROWSERS;

export const FRONTEND_URL = "http://localhost:5173/frontend/";
export const BACKEND_URL = "http://localhost:4200";

export default defineConfig({
    testDir: "e2e/tests",
    globalSetup: "./e2e/support/global-setup.ts",
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 2 : undefined,
    reporter: isCI ? [["list"], ["html", { open: "never" }]] : "html",
    use: {
        baseURL: FRONTEND_URL,
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
            command: "npx nest start",
            cwd: "backend",
            // All test users share one IP, so the production rate limits would trip.
            // When reusing a running backend, start it with this env var as well.
            env: { E2E_THROTTLE_MULTIPLIER: "100" },
            url: `${BACKEND_URL}/ready`,
            reuseExistingServer: !isCI,
            timeout: 120_000,
            stdout: "ignore",
            stderr: "pipe",
        },
        {
            command: "npx vite --port 5173 --strictPort",
            cwd: "frontend",
            url: FRONTEND_URL,
            reuseExistingServer: !isCI,
            timeout: 60_000,
        },
    ],
});
