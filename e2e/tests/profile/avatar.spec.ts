import { expect, test } from "../../support/test";
import { connectActors, fixtureFile } from "../../support/scenarios";

test.describe("Avatar", () => {
    test("uploads an avatar that contacts see too", async ({ createActor }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await connectActors(alice, bob);
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

        await bob.page.reload();
        await expect(
            bob.dashboard.sidebar
                .contact(alice.user.username)
                .getByRole("img", { name: "user avatar" }),
        ).toHaveAttribute("src", /^data:image\//);
    });
});
