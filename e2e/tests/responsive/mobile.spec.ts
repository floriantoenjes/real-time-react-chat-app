import { expect, test } from "../../support/test";

// Runs in the `mobile-chromium` project (Pixel 7 viewport) only.
test.describe("Mobile layout", () => {
    test("shows the contact list without the welcome message", async ({
        actor,
    }) => {
        const { sidebar, chat } = actor.dashboard;

        await expect(sidebar.root).toBeVisible();
        await expect(chat.welcomeMessage).toBeHidden();
    });

    test("switches between the contact list and a chat", async ({
        actor,
        createUser,
    }) => {
        const bob = await createUser("Bob");
        await actor.api.addContact(bob._id);
        await actor.page.reload();
        const { sidebar, chat } = actor.dashboard;

        await sidebar.openChat(bob.username);

        await expect(sidebar.root).toBeHidden();
        await expect(chat.messageInput).toBeVisible();
        await expect(chat.backButton).toBeVisible();

        await chat.backButton.click();

        await expect(sidebar.root).toBeVisible();
        await expect(chat.messageInput).toBeHidden();
        await expect(chat.welcomeMessage).toBeHidden();
    });
});
