import { expect, Locator, Page } from "@playwright/test";
import { expectSnackbar, snackbar } from "../support/snackbar";

export class DashboardPage {
    readonly sidebar: Sidebar;
    readonly chat: ChatView;

    constructor(readonly page: Page) {
        this.sidebar = new Sidebar(page);
        this.chat = new ChatView(page);
    }

    async goto() {
        await this.page.goto("dashboard");
        await expect(this.sidebar.userMenuButton).toBeVisible();
    }

    snackbar(text: string | RegExp): Locator {
        return snackbar(this.page, text);
    }

    async expectSnackbar(text: string | RegExp) {
        await expectSnackbar(this.page, text);
    }
}

export class Sidebar {
    readonly root: Locator;
    readonly contactSearch: Locator;
    readonly contacts: Locator;
    readonly userMenuButton: Locator;
    readonly openProfileButton: Locator;
    readonly drawer: Locator;
    readonly statusTextInput: Locator;
    /** Chats opened since the last full page load; the app serves them from its cache. */
    private readonly openedChats = new Set<string>();

    constructor(readonly page: Page) {
        page.on("load", () => this.openedChats.clear());
        this.root = page.locator(".sidebar");
        this.contactSearch = page.getByRole("combobox", {
            name: "Filter for or add a contact",
        });
        this.contacts = page.getByTestId("contact");
        this.userMenuButton = page.getByRole("button", { name: "User menu" });
        this.openProfileButton = page.getByTestId("open-profile");
        this.drawer = page.locator(".MuiDrawer-paper");
        this.statusTextInput = page.getByTestId("status-text-input");
    }

    contact(name: string): Locator {
        return this.page.locator(
            `[data-testid="contact"][data-contact-name="${name}"]`,
        );
    }

    async addContact(username: string) {
        await this.contactSearch.fill(username);
        await this.page
            .getByRole("option", { name: `${username} (add)`, exact: true })
            .click();
        await expect(this.contact(username)).toBeVisible();
    }

    async filterContacts(text: string) {
        await this.contactSearch.fill(text);
    }

    /**
     * Opens a chat and, the first time since the last page load, waits for its
     * history request. Later opens are served from the app's message cache.
     */
    async openChat(name: string) {
        if (this.openedChats.has(name)) {
            await this.contact(name).click();
            return;
        }
        const historyLoaded = this.page.waitForResponse(
            (response) =>
                response.url().endsWith("/get-messages") && response.ok(),
        );
        await this.contact(name).click();
        await historyLoaded;
        this.openedChats.add(name);
    }

    async openUserMenuItem(name: string) {
        await this.userMenuButton.click();
        await this.page.getByRole("menuitem", { name }).click();
    }

    async signOut() {
        await this.openUserMenuItem("Sign out");
    }

    /** Creates a group via the drawer; the group is named after its sorted members. */
    async createGroup(memberNames: string[]) {
        await this.openUserMenuItem("Create new group");
        const membersInput = this.page.getByRole("combobox", {
            name: "Members",
        });
        for (const member of memberNames) {
            await membersInput.click();
            await this.page
                .getByRole("option", { name: member, exact: true })
                .click();
        }
        await this.page
            .getByRole("button", { name: "Create new group" })
            .click();

        const groupName = [...memberNames].sort().join(", ");
        await expect(this.contact(groupName)).toBeVisible();
        return groupName;
    }

    async openIgnoredUsers() {
        await this.openUserMenuItem("Ignored Users");
        await expect(
            this.drawer.getByRole("heading", { name: "Ignored Users" }),
        ).toBeVisible();
    }

    async openLeftGroups() {
        await this.openUserMenuItem("Left Groups");
        await expect(
            this.drawer.getByRole("heading", { name: "Left Groups" }),
        ).toBeVisible();
    }

    async unignore(username: string) {
        await this.openIgnoredUsers();
        await this.drawer
            .getByRole("listitem")
            .filter({ hasText: username })
            .getByRole("button", { name: "Un-ignore" })
            .click();
        await this.page
            .getByRole("dialog")
            .getByRole("button", { name: "Un-ignore" })
            .click();
    }

    async rejoinGroup(groupName: string) {
        await this.openLeftGroups();
        await this.drawer
            .getByRole("listitem")
            .filter({ hasText: groupName })
            .getByRole("button", { name: "Rejoin" })
            .click();
    }

    async openProfile() {
        await this.openProfileButton.click();
        await expect(
            this.drawer.getByRole("heading", { name: "Edit your Profile" }),
        ).toBeVisible();
    }

    async uploadAvatar(filePath: string) {
        await this.openProfile();
        await this.page.getByTestId("avatar-input").setInputFiles(filePath);
        await this.page
            .getByRole("button", { name: "Save profile picture" })
            .click();
    }

    /** Sets (or clears, with an empty string) the status text; the drawer stays open. */
    async setStatusText(text: string) {
        await this.openProfile();
        await this.statusTextInput.fill(text);
        await this.page.getByRole("button", { name: "Save status" }).click();
    }

    /**
     * Closes the drawer by clicking its backdrop (right of the drawer). Escape is
     * unreliable: once the focused list entry is removed (rejoin, un-ignore), focus
     * falls back to <body> and the drawer no longer receives the key.
     */
    async closeDrawer() {
        await this.page.locator(".MuiDrawer-root .MuiBackdrop-root").click();
        await expect(this.drawer).toBeHidden();
    }
}

export class LanguageModal {
    readonly root: Locator;
    readonly select: Locator;

    constructor(readonly page: Page) {
        this.root = page
            .locator(".MuiModal-root")
            .filter({ has: page.getByRole("combobox") });
        this.select = this.root.getByRole("combobox");
    }

    /** Selects a language by its (untranslated) name and closes the modal. */
    async choose(language: "English" | "Deutsch", closeLabel: string) {
        await this.select.click();
        await this.page.getByRole("option", { name: language }).click();
        await expect(this.select).toHaveText(language);
        await this.root.getByRole("button", { name: closeLabel }).click();
        await expect(this.root).toBeHidden();
    }
}

export class ChatView {
    readonly messageInput: Locator;
    readonly sendButton: Locator;
    readonly recordAudioButton: Locator;
    readonly stopRecordingButton: Locator;
    readonly attachImageButton: Locator;
    readonly imageInput: Locator;
    readonly messages: Locator;
    readonly menuButton: Locator;
    readonly backButton: Locator;
    readonly videoCallButton: Locator;
    readonly voiceCallButton: Locator;
    readonly typingIndicator: Locator;
    readonly welcomeMessage: Locator;
    readonly contactProfileButton: Locator;
    readonly contactStatusText: Locator;

    constructor(readonly page: Page) {
        this.messageInput = page.getByRole("textbox", {
            name: "Enter a message",
        });
        this.sendButton = page.getByRole("button", { name: "Send message" });
        this.recordAudioButton = page.getByRole("button", {
            name: "Record audio message",
        });
        this.stopRecordingButton = page.getByRole("button", {
            name: "Stop recording",
        });
        this.attachImageButton = page.getByRole("button", {
            name: "Attach image",
        });
        this.imageInput = page.getByTestId("image-input");
        this.messages = page.getByTestId("chat-message");
        this.menuButton = page.getByRole("button", { name: "Chat menu" });
        this.backButton = page.getByRole("button", { name: "Back" });
        this.videoCallButton = page.getByRole("button", { name: "Video call" });
        this.voiceCallButton = page.getByRole("button", { name: "Voice call" });
        this.typingIndicator = page.getByTestId("typing-indicator");
        this.welcomeMessage = page.getByRole("heading", {
            name: "Welcome to Florian's Chat!",
        });
        this.contactProfileButton = page.getByTestId("open-contact-profile");
        this.contactStatusText = page.getByTestId("contact-status-text");
    }

    /** Opens the drawer with the profile of the selected contact or group. */
    async openContactProfile() {
        await this.contactProfileButton.click();
        await expect(this.page.locator(".MuiDrawer-paper")).toBeVisible();
    }

    message(text: string | RegExp): Locator {
        return this.messages.filter({ hasText: text });
    }

    async sendMessage(text: string, via: "enter" | "button" = "enter") {
        await this.messageInput.fill(text);
        if (via === "enter") {
            await this.messageInput.press("Enter");
        } else {
            await this.sendButton.click();
        }
        // Wait for the server to confirm, so consecutive sends really are sequential.
        await expect(
            this.message(text).last().getByTestId("message-sent"),
        ).toBeVisible();
    }

    async openMenuItem(name: string) {
        await this.menuButton.click();
        await this.page.getByRole("menuitem", { name }).click();
    }

    get confirmationDialog(): Locator {
        return this.page.getByRole("dialog");
    }

    /** Opens a chat menu item and confirms the dialog that follows. */
    async openMenuItemAndConfirm(name: string, confirmLabel = name) {
        await this.openMenuItem(name);
        await this.confirmationDialog
            .getByRole("button", { name: confirmLabel, exact: true })
            .click();
        await expect(this.confirmationDialog).toBeHidden();
    }

    async emptyChat() {
        await this.openMenuItemAndConfirm("Delete messages");
    }

    async deleteChat() {
        await this.openMenuItemAndConfirm("Delete chat");
    }

    async leaveGroup() {
        await this.openMenuItemAndConfirm("Leave group");
    }

    async ignoreContact() {
        await this.openMenuItem("Ignore");
        await this.page
            .getByRole("dialog")
            .getByRole("button", { name: "Ignore" })
            .click();
    }

    async attachImage(filePath: string) {
        await this.imageInput.setInputFiles(filePath);
    }
}
