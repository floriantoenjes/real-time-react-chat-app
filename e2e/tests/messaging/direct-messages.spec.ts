import { expect, test } from "../../support/test";
import { connectActors, openChatBetween } from "../../support/scenarios";

test.describe("Direct messages", () => {
    test("sends with Enter and delivers live", async ({ createActor }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await openChatBetween(alice, bob);

        await alice.dashboard.chat.sendMessage("Hello via Enter", "enter");

        await expect(alice.dashboard.chat.messageInput).toHaveValue("");
        await expect(
            bob.dashboard.chat.message("Hello via Enter"),
        ).toBeVisible();
    });

    test("sends with the send button and delivers live", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await openChatBetween(alice, bob);

        await alice.dashboard.chat.sendMessage("Hello via button", "button");

        await expect(alice.dashboard.chat.messageInput).toHaveValue("");
        await expect(
            bob.dashboard.chat.message("Hello via button"),
        ).toBeVisible();
    });

    test("does not send whitespace-only messages", async ({ createActor }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await openChatBetween(alice, bob);
        const { chat } = alice.dashboard;

        await chat.messageInput.fill("   ");

        await expect(chat.sendButton).toBeHidden();
        await chat.messageInput.press("Enter");
        await expect(chat.messages).toHaveCount(0);
    });

    test("shows the last message in the recipient's contact list", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await connectActors(alice, bob);
        await alice.dashboard.sidebar.openChat(bob.user.username);

        await alice.dashboard.chat.sendMessage("Short preview");
        const aliceInBobsList = bob.dashboard.sidebar.contact(
            alice.user.username,
        );
        await expect(aliceInBobsList).toContainText("Short preview");

        const longMessage =
            "This message is definitely longer than thirty-five characters";
        await alice.dashboard.chat.sendMessage(longMessage);
        await expect(aliceInBobsList).toContainText(
            `${longMessage.substring(0, 35)}...`,
        );
    });

    test("keeps the history across a reload", async ({ createActor }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await openChatBetween(alice, bob);
        await alice.dashboard.chat.sendMessage("First message");
        await bob.dashboard.chat.sendMessage("Second message");
        await expect(alice.dashboard.chat.messages).toHaveCount(2);

        await alice.page.reload();
        await alice.dashboard.sidebar.openChat(bob.user.username);

        await expect(alice.dashboard.chat.messages).toHaveText([
            /First message/,
            /Second message/,
        ]);
    });

    // Regression: the history fetch used to overwrite the temporary message,
    // which then turned into an empty ":" / "Invalid DateTime" bubble.
    test("keeps a message intact when it is sent before the history has loaded", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await connectActors(alice, bob);
        const { chat, sidebar } = alice.dashboard;

        // Deliberately not sidebar.openChat(): don't wait for the history.
        await sidebar.contact(bob.user.username).click();
        await chat.messageInput.fill("Sent right away");
        await chat.messageInput.press("Enter");

        await expect(
            chat.message("Sent right away").getByTestId("message-sent"),
        ).toBeVisible();
        await expect(chat.messages).toHaveCount(1);
    });

    // Regression: concurrent sends used to fail with a Mongo write conflict.
    test("delivers messages that both contacts send at the same time", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await connectActors(alice, bob);

        const sends = await Promise.allSettled([
            alice.api.sendMessage(bob.user._id, "Simultaneous from Alice"),
            bob.api.sendMessage(alice.user._id, "Simultaneous from Bob"),
        ]);

        expect(sends.map((s) => s.status)).toEqual(["fulfilled", "fulfilled"]);
        await alice.dashboard.sidebar.openChat(bob.user.username);
        await expect(alice.dashboard.chat.messages).toHaveCount(2);
    });

    test("deletes the chat messages", async ({ createActor }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await openChatBetween(alice, bob);
        const { chat, sidebar } = alice.dashboard;
        await chat.sendMessage("Soon to be gone");

        await chat.emptyChat();

        await alice.dashboard.expectSnackbar("Chat messages have been deleted");
        await expect(chat.messages).toHaveCount(0);

        await alice.page.reload();
        await sidebar.openChat(bob.user.username);
        await expect(chat.messageInput).toBeVisible();
        await expect(chat.messages).toHaveCount(0);
    });

    test("keeps the chat messages when deletion is cancelled", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await openChatBetween(alice, bob);
        const { chat } = alice.dashboard;
        await chat.sendMessage("Here to stay");

        await chat.openMenuItem("Delete messages");
        await expect(chat.confirmationDialog).toContainText(
            `Are you sure you want to delete all messages in your chat with ${bob.user.username}?`,
        );
        await chat.confirmationDialog
            .getByRole("button", { name: "Cancel" })
            .click();

        await expect(chat.confirmationDialog).toBeHidden();
        await expect(chat.messages).toHaveCount(1);
    });
});
