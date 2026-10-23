import { expect, test } from "@playwright/test";

test("login page loads", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("language", "en"));
    await page.goto("");

    await expect(page.locator("[name=email]")).toBeVisible();
    await expect(page.locator("[name=password]")).toBeVisible();
    await expect(page.locator("[type=submit]")).toBeVisible();
});
