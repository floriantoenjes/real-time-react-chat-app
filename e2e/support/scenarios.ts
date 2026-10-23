import path from "node:path";
import { expect } from "@playwright/test";
import type { Actor } from "./test";

export const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");

export const fixtureFile = (name: string) => path.join(FIXTURES_DIR, name);

/**
 * Makes both actors accepted contacts of each other via the API and reloads
 * their dashboards so the contact lists pick it up.
 */
export async function connectActors(a: Actor, b: Actor) {
    await a.api.addContact(b.user._id);
    await b.api.addContact(a.user._id);

    for (const [actor, contactName] of [
        [a, b.user.username],
        [b, a.user.username],
    ] as const) {
        await actor.page.reload();
        await expect(
            actor.dashboard.sidebar.contact(contactName),
        ).toBeVisible();
    }
}

/** Connects both actors and opens their chat with each other. */
export async function openChatBetween(a: Actor, b: Actor) {
    await connectActors(a, b);
    await a.dashboard.sidebar.openChat(b.user.username);
    await b.dashboard.sidebar.openChat(a.user.username);
    await expect(a.dashboard.chat.messageInput).toBeVisible();
    await expect(b.dashboard.chat.messageInput).toBeVisible();
}
