import { expect, test } from "../support/test";
import { LoginPage } from "../pages/auth.page";

test("login page loads", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.email).toBeVisible();
    await expect(loginPage.password).toBeVisible();
    await expect(loginPage.submit).toBeVisible();
});

test("fixtures sign in fresh users that can see each other", async ({
    actor,
    createActor,
}) => {
    const bob = await createActor("Bob");
    await actor.api.addContact(bob.user._id);

    await actor.page.reload();
    await expect(
        actor.dashboard.sidebar.contact(bob.user.username),
    ).toBeVisible();
    await expect(actor.dashboard.chat.welcomeMessage).toBeVisible();
});
