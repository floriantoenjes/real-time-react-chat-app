import { expect, test } from "../../support/test";
import { openChatBetween } from "../../support/scenarios";

test.describe("Status text", () => {
    test("sets a status text that contacts see without reloading", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await openChatBetween(alice, bob);
        const { chat } = bob.dashboard;
        // Bob keeps Alice's drawer open while she changes her status.
        await chat.openContactProfile();
        await expect(chat.contactStatusText).toHaveCount(0);

        await alice.dashboard.sidebar.setStatusText("  Out for lunch  ");

        await alice.dashboard.expectSnackbar("Your status has been updated");
        await expect(chat.contactStatusText).toHaveText("Out for lunch");

        // The text is stored trimmed and survives a reload.
        await alice.page.reload();
        await alice.dashboard.sidebar.openProfile();
        await expect(alice.dashboard.sidebar.statusTextInput).toHaveValue(
            "Out for lunch",
        );
    });

    test("clears the status text", async ({ createActor }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await alice.api.updateStatusText("Available");
        await openChatBetween(alice, bob);
        const { chat } = bob.dashboard;
        await chat.openContactProfile();
        await expect(chat.contactStatusText).toHaveText("Available");

        await alice.dashboard.sidebar.setStatusText("");

        await alice.dashboard.expectSnackbar("Your status has been updated");
        await expect(chat.contactStatusText).toHaveCount(0);
    });

    test("updates the user's other sessions", async ({
        createActor,
        signIn,
    }) => {
        const alice = await createActor("Alice");
        const aliceSecondTab = await signIn(alice.user);

        await alice.dashboard.sidebar.setStatusText("In a meeting");
        await alice.dashboard.expectSnackbar("Your status has been updated");

        // No reload: the field is filled from the live-updated user context.
        await aliceSecondTab.dashboard.sidebar.openProfile();
        await expect(
            aliceSecondTab.dashboard.sidebar.statusTextInput,
        ).toHaveValue("In a meeting");
    });

    test("limits the status text to 140 characters", async ({ actor }) => {
        const tooLong = await actor.api.patchStatusText("a".repeat(141));
        expect(tooLong.status()).toBe(400);

        // Surrounding whitespace doesn't count towards the limit.
        const user = await actor.api.updateStatusText(`  ${"a".repeat(140)}  `);
        expect(user.statusText).toBe("a".repeat(140));

        // The input doesn't accept more than the limit either.
        await actor.dashboard.sidebar.openProfile();
        const { statusTextInput } = actor.dashboard.sidebar;
        await statusTextInput.fill("b".repeat(140));
        await statusTextInput.pressSequentially("c");
        await expect(statusTextInput).toHaveValue("b".repeat(140));
        await expect(actor.page.getByText("140/140")).toBeVisible();
    });
});
