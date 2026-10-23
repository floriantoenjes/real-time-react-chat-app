import { expect, test } from "../../support/test";
import { connectActors, openChatBetween } from "../../support/scenarios";

test.describe("Read receipts", () => {
    test("marks a message read live while the recipient has the chat open", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await openChatBetween(alice, bob);

        await alice.dashboard.chat.sendMessage("Are you there?");

        const sentMessage = alice.dashboard.chat.message("Are you there?");
        await expect(sentMessage.getByTestId("message-sent")).toBeVisible();
        await expect(sentMessage.getByTestId("message-read")).toBeVisible();
    });

    test("shows a message as unread until the recipient opens the chat", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await connectActors(alice, bob);
        await alice.dashboard.sidebar.openChat(bob.user.username);

        await alice.dashboard.chat.sendMessage("Read me later");
        const sentMessage = alice.dashboard.chat.message("Read me later");
        await expect(sentMessage.getByTestId("message-sent")).toBeVisible();
        await expect(sentMessage.getByTestId("message-read")).toHaveCount(0);

        await bob.dashboard.sidebar.openChat(alice.user.username);
        await expect(bob.dashboard.chat.message("Read me later")).toBeVisible();

        // The read state is persisted; Alice sees it after a reload.
        await alice.page.reload();
        await alice.dashboard.sidebar.openChat(bob.user.username);
        await expect(sentMessage.getByTestId("message-read")).toBeVisible();
    });

    test.fixme(
        "marks a message read live when the recipient opens the chat later",
        // Bug: MessageService.getMessages() marks fetched messages read but emits
        // MESSAGE_READ with messageAuthorId = the reader instead of the author, so the
        // sender never gets the live read receipt (see validation.md → Bugs Found).
        async ({ createActor }) => {
            const alice = await createActor("Alice");
            const bob = await createActor("Bob");
            await connectActors(alice, bob);
            await alice.dashboard.sidebar.openChat(bob.user.username);
            await alice.dashboard.chat.sendMessage("Read me live");

            await bob.dashboard.sidebar.openChat(alice.user.username);

            await expect(
                alice.dashboard.chat
                    .message("Read me live")
                    .getByTestId("message-read"),
            ).toBeVisible();
        },
    );
});

test.describe("Typing indicator", () => {
    test("shows the indicator while the contact types", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await openChatBetween(alice, bob);
        const indicator = bob.dashboard.chat.typingIndicator;
        await expect(indicator).toBeHidden();

        await alice.dashboard.chat.messageInput.fill("I am typ");

        await expect(indicator).toBeVisible();
        await expect(indicator).toHaveText("is typing...");
        // The indicator resets itself after 5s without new typing events.
        await expect(indicator).toBeHidden({ timeout: 10_000 });
    });
});
