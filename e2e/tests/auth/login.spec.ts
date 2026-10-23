import { expect, test } from "../../support/test";
import { LoginPage, RegisterPage } from "../../pages/auth.page";
import { DashboardPage } from "../../pages/dashboard.page";
import { expectSnackbar } from "../../support/snackbar";
import { uniqueEmail, uniqueUsername } from "../../support/ids";

test.describe("Login", () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test("signs in with valid credentials", async ({ page, createUser }) => {
        const user = await createUser("Login");

        await loginPage.signIn(user.email, user.password);

        await expect(page).toHaveURL(/\/dashboard$/);
        await expect(
            new DashboardPage(page).sidebar.userMenuButton,
        ).toBeVisible();
    });

    test("rejects a wrong password", async ({ page, createUser }) => {
        const user = await createUser("Login");

        await loginPage.signIn(user.email, `${user.password}-wrong`);

        await expectSnackbar(page, "Invalid email or password");
        await expect(page).not.toHaveURL(/\/dashboard$/);
    });

    test("rejects an unknown email", async ({ page }) => {
        await loginPage.signIn(
            uniqueEmail(uniqueUsername("Nobody")),
            "irrelevant-password",
        );

        await expectSnackbar(page, "Invalid email or password");
        await expect(page).not.toHaveURL(/\/dashboard$/);
    });

    test("links to the registration page", async ({ page }) => {
        await loginPage.signUpLink.click();

        await expect(page).toHaveURL(/\/register$/);
        await expect(new RegisterPage(page).passwordConfirm).toBeVisible();
    });
});
