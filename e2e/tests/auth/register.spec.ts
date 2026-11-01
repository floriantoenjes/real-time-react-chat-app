import { expect, test } from "../../support/test";
import { LoginPage, RegisterPage } from "../../pages/auth.page";
import { expectSnackbar } from "../../support/snackbar";
import {
    DEFAULT_PASSWORD,
    uniqueEmail,
    uniqueUsername,
} from "../../support/ids";

test.describe("Register", () => {
    let registerPage: RegisterPage;

    test.beforeEach(async ({ page }) => {
        registerPage = new RegisterPage(page);
        await registerPage.goto();
    });

    test("creates an account and signs the user in", async ({ page }) => {
        const username = uniqueUsername("New");
        const email = uniqueEmail(username);

        await registerPage.register({
            email,
            password: DEFAULT_PASSWORD,
            username,
        });

        await expectSnackbar(page, "Your account has been created");
        // Sign-up sets the auth cookies and reloads into the dashboard.
        await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
    });

    test("created account can sign in again", async ({ page }) => {
        const username = uniqueUsername("New");
        const email = uniqueEmail(username);

        await registerPage.register({
            email,
            password: DEFAULT_PASSWORD,
            username,
        });
        await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });

        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.signIn(email, DEFAULT_PASSWORD);
        await expect(page).toHaveURL(/\/dashboard$/);
    });

    test("rejects mismatching passwords", async ({ page }) => {
        const username = uniqueUsername("New");

        await registerPage.register({
            email: uniqueEmail(username),
            password: DEFAULT_PASSWORD,
            passwordConfirm: `${DEFAULT_PASSWORD}-typo`,
            username,
        });

        await expect(page.getByText("Passwords don't match")).toBeVisible();
        await expect(page).toHaveURL(/\/register$/);
    });

    test("rejects an invalid email", async ({ page }) => {
        const username = uniqueUsername("New");

        // Passes the browser's type=email check but not the app's (zod) validation.
        await registerPage.register({
            email: "user@localhost",
            password: DEFAULT_PASSWORD,
            username,
        });

        await expect(
            page.getByText("Please enter a valid email"),
        ).toBeVisible();
        await expect(page).toHaveURL(/\/register$/);
    });

    test("rejects a password below the minimum length", async ({ page }) => {
        const username = uniqueUsername("New");

        await registerPage.register({
            email: uniqueEmail(username),
            password: "short",
            username,
        });

        await expect(
            page.getByText("Minimum length are 8 characters."),
        ).toBeVisible();
        await expect(page).toHaveURL(/\/register$/);
    });

    test("shows the password strength", async ({ page }) => {
        // Strong first: the helper already reads 0/4 before anything is typed.
        await registerPage.password.fill("vT9#qLm2!xZr8&Wd4@pK");
        await expect(page.getByText("Password strength: 4/4.")).toBeVisible();

        await registerPage.password.fill("aaaaaaaa");
        await expect(page.getByText("Password strength: 0/4.")).toBeVisible();
    });

    test("rejects an email that is already taken", async ({
        page,
        createUser,
    }) => {
        const existingUser = await createUser("Taken");

        await registerPage.register({
            email: existingUser.email,
            password: DEFAULT_PASSWORD,
            username: uniqueUsername("Other"),
        });

        await expectSnackbar(page, "This email is already taken");
        await expect(page).toHaveURL(/\/register$/);
    });

    test("links to the sign in page", async ({ page }) => {
        await registerPage.signInLink.click();

        await expect(new LoginPage(page).submit).toBeVisible();
    });
});
