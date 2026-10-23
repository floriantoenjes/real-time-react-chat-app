import { expect, test, Actor } from "../../support/test";
import { groupNameFor } from "../../support/scenarios";
import type { ContactGroup } from "../../../backend/shared/contact-group.contract";

test.describe("Left groups", () => {
    let alice: Actor;
    let bob: Actor;
    let carol: Actor;
    let group: ContactGroup;
    let carolsGroupName: string;
    let bobsGroupName: string;

    test.beforeEach(async ({ createActor }) => {
        alice = await createActor("Alice");
        bob = await createActor("Bob");
        carol = await createActor("Carol");
        const members = [alice.user, bob.user, carol.user];
        group = await alice.api.createGroup("ignored by backend", [
            bob.user._id,
            carol.user._id,
        ]);
        carolsGroupName = groupNameFor(carol.user, members);
        bobsGroupName = groupNameFor(bob.user, members);

        for (const member of [bob, carol]) {
            await member.page.reload();
        }
        await bob.dashboard.sidebar.openChat(bobsGroupName);
    });

    async function carolLeavesTheGroup() {
        const { sidebar, chat } = carol.dashboard;
        await sidebar.openChat(carolsGroupName);
        await chat.leaveGroup();
        await carol.dashboard.expectSnackbar(
            `You have left the group ${carolsGroupName}`,
        );
        await expect(sidebar.contact(carolsGroupName)).toBeHidden();
    }

    test("lists a left group", async () => {
        const { sidebar } = carol.dashboard;
        await sidebar.openLeftGroups();
        await expect(
            sidebar.drawer.getByText("You have not left any groups"),
        ).toBeVisible();
        await sidebar.closeDrawer();

        await carolLeavesTheGroup();

        await sidebar.openLeftGroups();
        await expect(
            sidebar.drawer.getByRole("listitem").filter({
                hasText: carolsGroupName,
            }),
        ).toBeVisible();
    });

    test("stops delivering messages to members who left", async () => {
        await carolLeavesTheGroup();

        await alice.api.sendMessage(group._id, "Carol should not see this");

        // Bob is the witness: once he has it, Carol would have it too.
        await expect(
            bob.dashboard.chat.message("Carol should not see this"),
        ).toBeVisible();
        await expect(
            carol.dashboard.sidebar.contact(carolsGroupName),
        ).toBeHidden();

        await carol.page.reload();
        await expect(carol.dashboard.sidebar.userMenuButton).toBeVisible();
        await expect(
            carol.dashboard.sidebar.contact(carolsGroupName),
        ).toBeHidden();
    });

    test("rejoins a group and receives its messages again", async () => {
        await carolLeavesTheGroup();
        const { sidebar } = carol.dashboard;

        await sidebar.rejoinGroup(carolsGroupName);

        await carol.dashboard.expectSnackbar(
            `You have rejoined ${carolsGroupName}`,
        );
        await expect(
            sidebar.drawer.getByText("You have not left any groups"),
        ).toBeVisible();
        await sidebar.closeDrawer();
        await sidebar.openChat(carolsGroupName);

        await alice.api.sendMessage(group._id, "Welcome back, Carol");

        await expect(
            carol.dashboard.chat.message("Welcome back, Carol"),
        ).toBeVisible();
    });
});
