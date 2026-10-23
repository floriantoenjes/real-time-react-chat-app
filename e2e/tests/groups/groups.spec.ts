import { expect, test } from "../../support/test";
import { groupNameFor } from "../../support/scenarios";

test.describe("Groups", () => {
    test("needs at least two contacts to create a group", async ({
        actor,
        createUser,
    }) => {
        const bob = await createUser("Bob");
        await actor.api.addContact(bob._id);
        await actor.page.reload();
        const { sidebar } = actor.dashboard;
        await expect(sidebar.contact(bob.username)).toBeVisible();

        await sidebar.userMenuButton.click();
        const createGroup = actor.page.getByRole("menuitem", {
            name: "Create new group",
        });
        await expect(createGroup).toBeDisabled();
        // The disabled item doesn't receive pointer events; its wrapper shows the tooltip.
        await createGroup.locator("..").hover();
        await expect(
            actor.page.getByRole("tooltip", {
                name: "You need at least two contacts to create a group",
            }),
        ).toBeVisible();
    });

    test("creates a group and delivers its messages to all members", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        const carol = await createActor("Carol");
        const members = [alice.user, bob.user, carol.user];
        await alice.api.addContact(bob.user._id);
        await alice.api.addContact(carol.user._id);
        await alice.page.reload();

        const groupName = await alice.dashboard.sidebar.createGroup([
            bob.user.username,
            carol.user.username,
        ]);
        expect(groupName).toBe(groupNameFor(alice.user, members));

        // Members have the group after loading their contacts.
        for (const member of [bob, carol]) {
            await member.page.reload();
            await member.dashboard.sidebar.openChat(
                groupNameFor(member.user, members),
            );
        }

        await alice.dashboard.sidebar.openChat(groupName);
        await alice.dashboard.chat.sendMessage("Hello group!");

        for (const member of [bob, carol]) {
            await expect(
                member.dashboard.chat.message(
                    `${alice.user.username}: Hello group!`,
                ),
            ).toBeVisible();
        }

        await bob.dashboard.chat.sendMessage("Hi from Bob");
        await expect(
            carol.dashboard.chat.message(`${bob.user.username}: Hi from Bob`),
        ).toBeVisible();
        await expect(
            alice.dashboard.chat.message(`${bob.user.username}: Hi from Bob`),
        ).toBeVisible();
    });

    test("auto-adds a group live when its first message arrives", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        const carol = await createActor("Carol");
        const group = await alice.api.createGroup("ignored by backend", [
            bob.user._id,
            carol.user._id,
        ]);

        await alice.api.sendMessage(group._id, "Surprise group");

        // Bob loaded his dashboard before the group existed; it shows up live.
        await expect(
            bob.dashboard.sidebar.contacts.filter({
                hasText: "Surprise group",
            }),
        ).toHaveCount(1);
    });

    test.fixme(
        "names a live-added group the same as after a reload",
        // Bug: MessageService.sendMessage() builds the CONTACT_GROUP_AUTO_ADD name from
        // memberRefs in member-id order without sorting, while
        // ContactGroupService.computeGroupNamesForUser() sorts the names. The name
        // changes on reload (see validation.md → Bugs Found).
        async ({ createActor }) => {
            // Ids follow creation order, so create the alphabetically last user first.
            const zora = await createActor("Zora");
            const abe = await createActor("Abe");
            const viewer = await createActor("Viewer");
            const members = [zora.user, abe.user, viewer.user];
            const group = await zora.api.createGroup("ignored by backend", [
                abe.user._id,
                viewer.user._id,
            ]);
            await zora.api.sendMessage(group._id, "Name check");
            const expectedName = groupNameFor(viewer.user, members);

            await expect(
                viewer.dashboard.sidebar.contact(expectedName),
            ).toBeVisible();
            await viewer.page.reload();
            await expect(
                viewer.dashboard.sidebar.contact(expectedName),
            ).toBeVisible();
        },
    );
});
