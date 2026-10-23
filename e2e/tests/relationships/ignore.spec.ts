import { expect, test } from "../../support/test";
import { connectActors } from "../../support/scenarios";

test.describe("Ignoring users", () => {
    test("ignores a contact from the chat menu", async ({ createActor }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await connectActors(alice, bob);
        const { sidebar, chat } = alice.dashboard;
        const bobName = bob.user.username;

        await sidebar.openChat(bobName);
        await chat.ignoreContact();

        await alice.dashboard.expectSnackbar(`${bobName} has been ignored`);
        await expect(sidebar.contact(bobName)).toBeHidden();
        await sidebar.openIgnoredUsers();
        await expect(
            sidebar.drawer.getByRole("listitem").filter({ hasText: bobName }),
        ).toBeVisible();
    });

    test("keeps the contact when ignoring is cancelled", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await connectActors(alice, bob);
        const { sidebar, chat } = alice.dashboard;

        await sidebar.openChat(bob.user.username);
        await chat.openMenuItem("Ignore");
        const dialog = alice.page.getByRole("dialog");
        await expect(dialog).toContainText(
            `Are you sure you want to ignore ${bob.user.username}?`,
        );
        await dialog.getByRole("button", { name: "Cancel" }).click();

        await expect(dialog).toBeHidden();
        await expect(sidebar.contact(bob.user.username)).toBeVisible();
    });

    test("does not deliver messages from an ignored user", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        const carol = await createActor("Carol");
        await connectActors(alice, bob);
        await connectActors(alice, carol);
        const { sidebar } = alice.dashboard;

        await sidebar.openChat(bob.user.username);
        await alice.dashboard.chat.ignoreContact();
        await expect(sidebar.contact(bob.user.username)).toBeHidden();

        await bob.api.sendMessage(alice.user._id, "Can you hear me?");
        // Carol is the witness: her later message arrives, Bob's does not.
        await carol.api.sendMessage(alice.user._id, "Carol was here");

        await expect(sidebar.contact(carol.user.username)).toContainText(
            "Carol was here",
        );
        await expect(sidebar.contact(bob.user.username)).toBeHidden();

        await alice.page.reload();
        await expect(sidebar.contact(carol.user.username)).toBeVisible();
        await expect(sidebar.contact(bob.user.username)).toBeHidden();
    });

    test("un-ignores a user who can then reach you again", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await connectActors(alice, bob);
        const { sidebar, chat } = alice.dashboard;
        const bobName = bob.user.username;
        await sidebar.openChat(bobName);
        await chat.ignoreContact();
        await expect(sidebar.contact(bobName)).toBeHidden();

        await sidebar.unignore(bobName);

        await alice.dashboard.expectSnackbar(`${bobName} has been un-ignored`);
        await expect(
            sidebar.drawer.getByText("You have not ignored any users"),
        ).toBeVisible();
        await sidebar.closeDrawer();

        // Ignoring removed Bob as a contact, so he doesn't reappear after
        // un-ignoring and his next message arrives as a new contact request.
        await expect(sidebar.contact(bobName)).toBeHidden();
        await bob.api.sendMessage(alice.user._id, "Friends again?");
        await expect(sidebar.contact(bobName)).toBeVisible();
        await sidebar.openChat(bobName);
        await expect(
            alice.page.getByText(
                `Do you want to accept ${bobName} as a contact for further messages?`,
            ),
        ).toBeVisible();
    });

    test("ignores a stranger from the contact request", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        const bobName = bob.user.username;
        await bob.api.addContact(alice.user._id);
        await bob.api.sendMessage(alice.user._id, "Buy my stuff");
        const { sidebar } = alice.dashboard;
        await expect(sidebar.contact(bobName)).toBeVisible();

        await sidebar.openChat(bobName);
        await alice.page
            .getByRole("button", { name: "Ignore", exact: true })
            .click();
        await alice.page
            .getByRole("dialog")
            .getByRole("button", { name: "Ignore" })
            .click();

        await alice.dashboard.expectSnackbar(`${bobName} has been ignored`);
        await expect(sidebar.contact(bobName)).toBeHidden();
    });
});
