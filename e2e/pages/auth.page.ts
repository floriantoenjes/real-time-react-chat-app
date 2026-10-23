import { Locator, Page } from "@playwright/test";

// MUI appends " *" to the label of required fields (the login password is required).
const PASSWORD_LABEL = /^Password(\s*\*)?$/;

export class LoginPage {
    readonly email: Locator;
    readonly password: Locator;
    readonly submit: Locator;
    readonly signUpLink: Locator;

    constructor(readonly page: Page) {
        this.email = page.getByLabel("E-Mail");
        this.password = page.getByLabel(PASSWORD_LABEL);
        this.submit = page.getByRole("button", { name: "Sign in" });
        this.signUpLink = page.getByRole("link", { name: "or Sign up" });
    }

    async goto() {
        await this.page.goto("");
    }

    async signIn(email: string, password: string) {
        await this.email.fill(email);
        await this.password.fill(password);
        await this.submit.click();
    }
}

export class RegisterPage {
    readonly email: Locator;
    readonly password: Locator;
    readonly passwordConfirm: Locator;
    readonly username: Locator;
    readonly submit: Locator;
    readonly signInLink: Locator;

    constructor(readonly page: Page) {
        this.email = page.getByLabel("E-Mail");
        this.password = page.getByLabel(PASSWORD_LABEL);
        this.passwordConfirm = page.getByLabel("Confirm Password");
        this.username = page.getByLabel("Username");
        this.submit = page.getByRole("button", { name: "Sign up" });
        this.signInLink = page.getByRole("link", { name: "or Sign in" });
    }

    async goto() {
        await this.page.goto("register");
    }

    async register(data: {
        email: string;
        password: string;
        passwordConfirm?: string;
        username: string;
    }) {
        await this.email.fill(data.email);
        await this.password.fill(data.password);
        await this.passwordConfirm.fill(data.passwordConfirm ?? data.password);
        await this.username.fill(data.username);
        await this.submit.click();
    }
}
