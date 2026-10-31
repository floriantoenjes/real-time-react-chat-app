import { expect, test } from "../../support/test";

test.describe("Contact requests", () => {
    test("auto-adds the sender and lets the recipient accept", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        const aliceName = alice.user.username;
        const bobName = bob.user.username;

        // Only Alice adds Bob; Bob doesn't know Alice yet.
        await alice.api.addContact(bob.user._id);
        await alice.page.reload();
        await alice.dashboard.sidebar.openChat(bobName);
        await alice.dashboard.chat.sendMessage("Hi Bob, it's Alice!");

        // Bob gets Alice auto-added live, as a not yet accepted contact.
        await expect(bob.dashboard.sidebar.contact(aliceName)).toBeVisible();
        await bob.dashboard.sidebar.openChat(aliceName);
        const question = bob.page.getByText(
            `Do you want to accept ${aliceName} as a contact for further messages?`,
        );
        await expect(question).toBeVisible();

        await bob.page
            .getByRole("button", { name: "Yes", exact: true })
            .click();

        await bob.dashboard.expectSnackbar(
            `Enabled ${aliceName} for further messages`,
        );
        await expect(question).toBeHidden();
        await expect(
            bob.dashboard.chat.message("Hi Bob, it's Alice!"),
        ).toBeVisible();

        await bob.dashboard.chat.sendMessage("Hi Alice!");
        await expect(alice.dashboard.chat.message("Hi Alice!")).toBeVisible();
    });

    test("lets the recipient decline", async ({ createActor }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        const aliceName = alice.user.username;

        await alice.api.addContact(bob.user._id);
        await alice.api.sendMessage(bob.user._id, "Hello stranger");

        const { sidebar } = bob.dashboard;
        await expect(sidebar.contact(aliceName)).toBeVisible();
        await sidebar.openChat(aliceName);
        await bob.page.getByRole("button", { name: "No", exact: true }).click();
        await bob.page
            .getByRole("dialog")
            .getByRole("button", { name: "Decline", exact: true })
            .click();

        await bob.dashboard.expectSnackbar(
            `${aliceName} is no longer a contact`,
        );
        await expect(sidebar.contact(aliceName)).toBeHidden();
    });
});
