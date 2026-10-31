import {
    Browser,
    BrowserContext,
    BrowserContextOptions,
    test as base,
    Page,
} from "@playwright/test";
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
            const actor = await openSignedInActor(browser, user);
            actors.push(actor);
            await actor.dashboard.goto();
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

/**
 * Opens a new browser context and page signed in as `user`, without navigating yet.
 * The caller closes `context` and disposes `api`.
 * `browser.newContext()` inherits the project's `use` options (baseURL, viewport, ...);
 * `contextOptions` can add to them, e.g. `recordVideo`.
 */
export async function openSignedInActor(
    browser: Browser,
    user: TestUser,
    contextOptions: BrowserContextOptions = {},
): Promise<Actor> {
    const context = await browser.newContext({
        ...contextOptions,
        storageState: {
            cookies: [
                authCookie("accessToken", user.accessToken, "/"),
                authCookie("refreshToken", user.refreshToken, "/refresh"),
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
    return { user, context, page, dashboard, api };
}

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
