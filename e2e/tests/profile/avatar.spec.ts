import { expect, test } from "../../support/test";
import { fixtureFile, openChatBetween } from "../../support/scenarios";

test.describe("Avatar", () => {
    test("uploads an avatar that contacts see without reloading", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await openChatBetween(alice, bob);
        const { sidebar } = alice.dashboard;
        // New users have no avatar image yet.
        const ownAvatar = sidebar.openProfileButton.getByRole("img", {
            name: "user avatar",
        });
        await expect(ownAvatar).toHaveCount(0);

        await sidebar.uploadAvatar(fixtureFile("avatar.png"));

        await alice.dashboard.expectSnackbar(
            "Your profile picture has been updated",
        );
        await expect(ownAvatar).toHaveAttribute("src", /^data:image\//);

        // Bob has Alice's chat open; both the contact list and the top bar update live.
        await expect(
            bob.dashboard.sidebar
                .contact(alice.user.username)
                .getByRole("img", { name: "user avatar" }),
        ).toHaveAttribute("src", /^data:image\//);
        await expect(
            bob.dashboard.chat.contactProfileButton.getByRole("img", {
                name: "user avatar",
            }),
        ).toHaveAttribute("src", /^data:image\//);

        // And it's still there after a reload.
        await bob.page.reload();
        await expect(
            bob.dashboard.sidebar
                .contact(alice.user.username)
                .getByRole("img", { name: "user avatar" }),
        ).toHaveAttribute("src", /^data:image\//);
    });
});
