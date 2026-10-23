import { expect, test } from "@playwright/test";
import { ExternalErrors } from "../../../backend/shared/enums/errors.enum";

// The e2e backend runs with E2E_THROTTLE_MULTIPLIER, so the real limit can't be hit here.
// This verifies how the UI handles a 429; the limits themselves are a backend concern.
test("shows a rate limit message when sign in is throttled", async ({
    page,
}) => {
    await page.route("**/login", (route) =>
        route.fulfill({
            status: 429,
            headers: { "Retry-After": "60" },
            json: {
                errorCode: ExternalErrors.EXT_RATE_LIMIT_001,
                message: "Too many requests. Please try again later.",
                timestamp: new Date().toISOString(),
            },
        }),
    );
    await page.addInitScript(() => localStorage.setItem("language", "en"));
    await page.goto("");

    await page.locator("[name=email]").fill("florian@email.com");
    await page.locator("[name=password]").fill("password");
    await page.locator("[type=submit]").click();

    await expect(
        page.getByText("Too many requests in a short period of time"),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/dashboard/);
});
