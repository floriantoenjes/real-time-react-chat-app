import { expect, test } from "../../support/test";
import { connectActors } from "../../support/scenarios";

test.describe("Online status", () => {
    test("shows contacts online while connected and offline afterwards", async ({
        createActor,
    }) => {
        const alice = await createActor("Alice");
        const bob = await createActor("Bob");
        await connectActors(alice, bob);
        const { sidebar, chat } = alice.dashboard;
        const bobInList = sidebar.contact(bob.user.username);

        await expect(bobInList.getByTestId("online-indicator")).toBeVisible();
        await sidebar.openChat(bob.user.username);
        // Calls themselves are out of scope; only their availability is checked.
        await expect(chat.videoCallButton).toBeEnabled();
        await expect(chat.voiceCallButton).toBeEnabled();

        await bob.context.close();

        await expect(bobInList.getByTestId("online-indicator")).toBeHidden();
        await expect(chat.videoCallButton).toBeDisabled();
        await expect(chat.voiceCallButton).toBeDisabled();
    });

    test("shows a contact coming online", async ({
        createActor,
        createUser,
        signIn,
    }) => {
        const alice = await createActor("Alice");
        const bobUser = await createUser("Bob");
        await alice.api.addContact(bobUser._id);
        await alice.page.reload();
        const bobInList = alice.dashboard.sidebar.contact(bobUser.username);
        await expect(bobInList).toBeVisible();
        await expect(bobInList.getByTestId("online-indicator")).toBeHidden();

        await signIn(bobUser);

        await expect(bobInList.getByTestId("online-indicator")).toBeVisible();
    });
});
