import { expect, test } from "../../support/test";
import { fixtureFile, openChatBetween } from "../../support/scenarios";

test.describe("Media messages", () => {
    test("sends an image that the recipient can open", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await openChatBetween(alice, bob);

        await alice.dashboard.chat.attachImage(fixtureFile("image.png"));

        const sent = alice.dashboard.chat.messages.and(
            alice.page.locator('[data-message-type="image"]'),
        );
        await expect(sent).toHaveCount(1);
        await expect(
            alice.dashboard.sidebar.contact(bob.user.username),
        ).toContainText("Image message");

        const received = bob.dashboard.chat.messages.and(
            bob.page.locator('[data-message-type="image"]'),
        );
        await expect(received).toHaveCount(1);
        await received.getByRole("button", { name: "Show Image" }).click();
        await expect(received.locator("img")).toBeVisible();
    });

    test("rejects a file that is not an image", async ({ createActor }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await openChatBetween(alice, bob);

        await alice.dashboard.chat.attachImage(fixtureFile("not-an-image.png"));

        await alice.dashboard.expectSnackbar("Invalid file type");
        await expect(alice.dashboard.chat.messages).toHaveCount(0);
        await expect(bob.dashboard.chat.messages).toHaveCount(0);
    });

    test(
        "records and sends an audio message",
        { tag: "@chromium-only" }, // relies on Chromium's fake microphone flags
        async ({ createActor }) => {
            const alice = await createActor("Alice");
            const bob = await createActor("Bob");
            await openChatBetween(alice, bob);
            const { chat } = alice.dashboard;

            await chat.recordAudioButton.click();
            await expect(chat.stopRecordingButton).toBeVisible();
            // Deliberate: the recording needs a real duration (not a sync wait).
            await alice.page.waitForTimeout(1_500);
            await chat.stopRecordingButton.click();
            await expect(chat.recordAudioButton).toBeVisible();

            for (const actor of [alice, bob]) {
                const audioMessage = actor.dashboard.chat.messages.and(
                    actor.page.locator('[data-message-type="audio"]'),
                );
                await expect(audioMessage).toHaveCount(1);
                await expect(
                    audioMessage.getByRole("button", { name: "Play" }),
                ).toBeVisible();
            }
            await expect(
                alice.dashboard.sidebar.contact(bob.user.username),
            ).toContainText(/Audio message: \d+s/);
        },
    );
});
