import { expect, test } from "../../support/test";
import { LoginPage } from "../../pages/auth.page";

test.describe("Session", () => {
    test("stays signed in across a reload", async ({ actor }) => {
        await actor.page.reload();

        await expect(actor.page).toHaveURL(/\/dashboard$/);
        await expect(actor.dashboard.sidebar.userMenuButton).toBeVisible();
    });

    test("redirects signed-out users from the dashboard to sign in", async ({
        page,
    }) => {
        await page.goto("dashboard");

        await expect(page).not.toHaveURL(/\/dashboard$/);
        await expect(new LoginPage(page).submit).toBeVisible();
    });

    test("signs out and blocks the dashboard afterwards", async ({ actor }) => {
        await actor.dashboard.sidebar.signOut();

        await actor.dashboard.expectSnackbar(
            "You have been logged out successfully",
        );
        const loginPage = new LoginPage(actor.page);
        await expect(loginPage.submit).toBeVisible();

        await actor.page.goto("dashboard");
        await expect(actor.page).not.toHaveURL(/\/dashboard$/);
        await expect(loginPage.submit).toBeVisible();
    });

    test("can sign in again after signing out", async ({ actor }) => {
        await actor.dashboard.sidebar.signOut();
        const loginPage = new LoginPage(actor.page);

        await loginPage.signIn(actor.user.email, actor.user.password);

        await expect(actor.page).toHaveURL(/\/dashboard$/);
        await expect(actor.dashboard.sidebar.userMenuButton).toBeVisible();
    });
});
