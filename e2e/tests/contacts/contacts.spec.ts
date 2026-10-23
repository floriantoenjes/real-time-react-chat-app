import { expect, test } from "../../support/test";

test.describe("Contacts", () => {
    test("searches for a user and adds them as a contact", async ({
        createUser,
        createActor,
    }) => {
        // The user list is loaded when the dashboard opens, so create Bob first.
        const bob = await createUser("Bob");
        const me = await createActor("Me");
        const { sidebar } = me.dashboard;

        await sidebar.addContact(bob.username);

        await me.dashboard.expectSnackbar(
            `${bob.username} has been added as a contact`,
        );
        await me.page.reload();
        await expect(sidebar.contact(bob.username)).toBeVisible();
    });

    test("does not offer existing contacts or yourself", async ({
        createUser,
        createActor,
    }) => {
        const bob = await createUser("Bob");
        const carol = await createUser("Carol");
        const me = await createActor("Me");
        await me.api.addContact(bob._id);
        await me.page.reload();
        const { sidebar } = me.dashboard;

        // Control: users who aren't contacts yet are offered.
        await sidebar.contactSearch.fill(carol.username);
        await expect(
            me.page.getByRole("option", { name: `${carol.username} (add)` }),
        ).toBeVisible();

        await sidebar.contactSearch.fill(bob.username);
        await expect(
            me.page.getByRole("option", { name: `${bob.username} (add)` }),
        ).toHaveCount(0);

        await sidebar.contactSearch.fill(me.user.username);
        await expect(
            me.page.getByRole("option", { name: `${me.user.username} (add)` }),
        ).toHaveCount(0);
    });

    test("filters the contact list by name", async ({ actor, createUser }) => {
        const bob = await createUser("Bob");
        const carol = await createUser("Carol");
        await actor.api.addContact(bob._id);
        await actor.api.addContact(carol._id);
        await actor.page.reload();
        const { sidebar } = actor.dashboard;
        await expect(sidebar.contacts).toHaveCount(2);

        await sidebar.filterContacts(bob.username.slice(0, 5));
        await expect(sidebar.contact(bob.username)).toBeVisible();
        await expect(sidebar.contact(carol.username)).toBeHidden();

        await sidebar.filterContacts("");
        await expect(sidebar.contacts).toHaveCount(2);
    });

    test("deletes a chat and removes the contact", async ({
        actor,
        createUser,
    }) => {
        const bob = await createUser("Bob");
        await actor.api.addContact(bob._id);
        await actor.page.reload();
        const { sidebar, chat } = actor.dashboard;

        await sidebar.openChat(bob.username);
        await chat.deleteChat();

        await actor.dashboard.expectSnackbar(
            `${bob.username} is no longer a contact`,
        );
        await expect(sidebar.contact(bob.username)).toBeHidden();
        await expect(chat.welcomeMessage).toBeVisible();

        await actor.page.reload();
        await expect(sidebar.userMenuButton).toBeVisible();
        await expect(sidebar.contact(bob.username)).toBeHidden();
    });
});
