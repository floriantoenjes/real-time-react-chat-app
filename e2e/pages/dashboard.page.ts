import { expect, Locator, Page } from "@playwright/test";

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
        return this.page.getByRole("alert").filter({ hasText: text });
    }

    async expectSnackbar(text: string | RegExp) {
        await expect(this.snackbar(text)).toBeVisible();
    }
}

export class Sidebar {
    readonly root: Locator;
    readonly contactSearch: Locator;
    readonly contacts: Locator;
    readonly userMenuButton: Locator;
    readonly openProfileButton: Locator;
    readonly drawer: Locator;

    constructor(readonly page: Page) {
        this.root = page.locator(".sidebar");
        this.contactSearch = page.getByRole("combobox", {
            name: "Filter for or add a contact",
        });
        this.contacts = page.getByTestId("contact");
        this.userMenuButton = page.getByRole("button", { name: "User menu" });
        this.openProfileButton = page.getByTestId("open-profile");
        this.drawer = page.locator(".MuiDrawer-paper");
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

    async openChat(name: string) {
        await this.contact(name).click();
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

    async closeDrawer() {
        await this.page.keyboard.press("Escape");
        await expect(this.drawer).toBeHidden();
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
        await expect(this.message(text)).toBeVisible();
    }

    async openMenuItem(name: string) {
        await this.menuButton.click();
        await this.page.getByRole("menuitem", { name }).click();
    }

    async emptyChat() {
        await this.openMenuItem("Delete messages");
    }

    async deleteChat() {
        await this.openMenuItem("Delete chat");
    }

    async leaveGroup() {
        await this.openMenuItem("Leave group");
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
