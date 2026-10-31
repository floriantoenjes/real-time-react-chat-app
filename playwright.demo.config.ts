import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";

/**
 * Records the README demo GIF (`npm run demo:gif`), see demo/demo.spec.ts. It lives
 * at the root so the inherited relative paths (globalSetup, webServer cwd) still resolve.
 */
export default defineConfig({
    ...baseConfig,
    testDir: "demo",
    testMatch: /demo\.spec\.ts/,
    outputDir: "test-results/demo",
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: "list",
    timeout: 120_000,
    use: {
        ...baseConfig.use,
        trace: "off",
        video: "off",
        screenshot: "off",
    },
    projects: [
        {
            name: "demo",
            use: {
                ...devices["Desktop Chrome"],
                // At least 768px (Tailwind `md`), or the app switches to its mobile layout and hides
                // the contact list while a chat is open.
                viewport: { width: 800, height: 720 },
            },
        },
    ],
});
