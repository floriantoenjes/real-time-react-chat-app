import { BrowserContext, test as base, Page } from "@playwright/test";
import { ApiClient, createUser, TestUser } from "./api";
import { DashboardPage } from "../pages/dashboard.page";
import { FRONTEND_ORIGIN } from "./urls";

export interface Actor {
    user: TestUser;
    context: BrowserContext;
    page: Page;
    dashboard: DashboardPage;
    api: ApiClient;
}

interface Fixtures {
    /** Registers a fresh user via the API (no browser). */
    createUser: (namePrefix?: string) => Promise<TestUser>;
    /** Opens a new, signed-in browser context on the dashboard for the given user. */
    signIn: (user: TestUser) => Promise<Actor>;
    /** `createUser` + `signIn` in one step. */
    createActor: (namePrefix?: string) => Promise<Actor>;
    /** A signed-in user on the dashboard, for single-user tests. */
    actor: Actor;
}

export const test = base.extend<Fixtures>({
    createUser: async ({}, use) => {
        await use((namePrefix) => createUser(namePrefix));
    },

    signIn: async ({ browser }, use) => {
        const actors: Actor[] = [];

        await use(async (user) => {
            // browser.newContext() inherits the project's `use` options (baseURL, viewport, ...).
            const context = await browser.newContext({
                storageState: {
                    cookies: [
                        authCookie("accessToken", user.accessToken, "/"),
                        authCookie(
                            "refreshToken",
                            user.refreshToken,
                            "/refresh",
                        ),
                    ],
                    origins: [
                        {
                            origin: FRONTEND_ORIGIN,
                            localStorage: [
                                { name: "language", value: "en" },
                                { name: "signedIn", value: "true" },
                            ],
                        },
                    ],
                },
            });
            const page = await context.newPage();
            const dashboard = new DashboardPage(page);
            const api = await ApiClient.create(user);
            const actor = { user, context, page, dashboard, api };
            actors.push(actor);

            await dashboard.goto();
            return actor;
        });

        for (const actor of actors) {
            await actor.api.dispose();
            await actor.context.close();
        }
    },

    createActor: async ({ createUser, signIn }, use) => {
        await use(async (namePrefix) => signIn(await createUser(namePrefix)));
    },

    actor: async ({ createActor }, use) => {
        await use(await createActor("Me"));
    },
});

function authCookie(name: string, value: string, path: string) {
    return {
        name,
        value,
        domain: "localhost",
        path,
        expires: -1,
        httpOnly: true,
        secure: true,
        sameSite: "Lax" as const,
    };
}

export { expect } from "@playwright/test";
