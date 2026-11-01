import fs from "node:fs";
import path from "node:path";
import { Browser, request } from "@playwright/test";
import {
    expect,
    openSignedInActor,
    test,
    type Actor,
} from "../e2e/support/test";
import { ApiClient, readSetCookie, type TestUser } from "../e2e/support/api";
import { groupNameFor } from "../e2e/support/scenarios";
import { BACKEND_URL } from "../e2e/support/urls";
import { DEFAULT_PASSWORD } from "../e2e/support/ids";

/**
 * The README demo: two users side by side chatting in real time. A third contact
 * and a group with all three fill the contact lists. Not part of the
 * e2e suite; run it with `npm run demo:gif`, which also turns the recordings into
 * imgs/demo.gif (see demo/make-gif.sh).
 *
 * The users have fixed names so the GIF reads well, so they are reused across runs
 * against the persistent local database and their chat is emptied first.
 */

const IMAGE_TO_SHARE = path.join(__dirname, "..", "imgs", "florians-chat.jpg");
const MANIFEST = path.join(
    __dirname,
    "..",
    "test-results",
    "demo",
    "manifest.json",
);
const TYPING_DELAY_MS = 70;
/** The seeded users' default avatars (see InitService): Florian's for Bob, Stella's for Alice. */
const AVATARS_DIR = path.join(__dirname, "..", "frontend", "public", "avatars");
const AVATAR_OF = {
    Alice: "avatar4.svg",
    Bob: "avatar1.svg",
    Carol: "avatar3.svg",
} as const;
const AVATAR_SIZE = 512;

/** An arrow pointer that follows the mouse, since headless recordings show no cursor. */
const FAKE_CURSOR = () => {
    window.addEventListener("DOMContentLoaded", () => {
        const cursor = document.createElement("div");
        cursor.innerHTML =
            '<svg width="16" height="24" viewBox="0 0 16 24">' +
            '<path d="M1 1 L1 19 L5.5 14.5 L8.5 21.5 L11 20.5 L8 13.5 L14 13.5 Z" ' +
            'fill="white" stroke="black" stroke-width="1.2" stroke-linejoin="round"/>' +
            "</svg>";
        Object.assign(cursor.style, {
            position: "fixed",
            zIndex: "2147483647",
            pointerEvents: "none",
            // The arrow's tip (top left) is the hotspot.
            left: "-50px",
            top: "-50px",
            filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3))",
        });
        document.body.appendChild(cursor);
        document.addEventListener(
            "mousemove",
            (e) => {
                cursor.style.left = `${e.clientX}px`;
                cursor.style.top = `${e.clientY}px`;
            },
            true,
        );
    });
};

/** Signs in a fixed demo user, registering it on the first run. */
async function demoUser(username: string): Promise<TestUser> {
    const email = `${username.toLowerCase()}@demo.test`;
    const password = DEFAULT_PASSWORD;
    const api = await request.newContext({ baseURL: BACKEND_URL });
    try {
        let signIn = await api.post("/login", { data: { email, password } });
        if (!signIn.ok()) {
            const signUp = await api.post("/register", {
                data: { email, password, username },
            });
            expect(signUp.status(), await signUp.text()).toBe(201);
            signIn = await api.post("/login", { data: { email, password } });
        }
        expect(signIn.status(), await signIn.text()).toBe(200);
        const accessToken = readSetCookie(signIn, "accessToken");
        const refreshToken = readSetCookie(signIn, "refreshToken");

        const me = await api.get("/signed-in-user", {
            headers: { cookie: `accessToken=${accessToken}` },
        });
        expect(me.status(), await me.text()).toBe(200);
        const { _id } = await me.json();
        return { _id, username, email, password, accessToken, refreshToken };
    } finally {
        await api.dispose();
    }
}

/**
 * Gives `user` one of the default SVG avatars. The upload endpoint only takes raster
 * images, so the SVG is rendered to a square PNG first, on the light blue the app
 * shows behind avatars, and then uploaded like a profile picture.
 */
async function setDefaultAvatar(
    browser: Browser,
    user: TestUser,
    svgFile: string,
) {
    const svg = fs.readFileSync(path.join(AVATARS_DIR, svgFile), "utf8");
    const renderer = await browser.newPage();
    let png: Buffer;
    try {
        await renderer.setContent(
            `<div id="avatar" style="width:${AVATAR_SIZE}px;height:${AVATAR_SIZE}px;` +
                `background:lightblue;display:flex;justify-content:center">` +
                `<img style="height:100%" src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}"></div>`,
        );
        png = await renderer.locator("#avatar").screenshot();
    } finally {
        await renderer.close();
    }

    const api = await request.newContext({ baseURL: BACKEND_URL });
    try {
        const upload = await api.post("/users/avatar", {
            headers: { cookie: `accessToken=${user.accessToken}` },
            multipart: {
                avatar: {
                    name: "avatar.png",
                    mimeType: "image/png",
                    buffer: png,
                },
                x: "0",
                y: "0",
                width: String(AVATAR_SIZE),
                height: String(AVATAR_SIZE),
            },
        });
        expect(upload.status(), await upload.text()).toBe(201);
    } finally {
        await api.dispose();
    }
}

/**
 * Makes Alice, Bob and Carol mutual contacts and gives Alice a group with both, so
 * the contact lists look lived in. Only adds what is missing, for reruns. Returns
 * the group.
 */
async function setUpContactsAndGroup(users: TestUser[]) {
    const apis = await Promise.all(users.map((user) => ApiClient.create(user)));
    try {
        for (const [i, api] of apis.entries()) {
            const contactIds = (await api.getContacts()).map((c) => c._id);
            for (const other of users) {
                if (other !== users[i] && !contactIds.includes(other._id)) {
                    await api.addContact(other._id);
                }
            }
        }
        const [aliceApi] = apis;
        const [, ...others] = users;
        const existing = await aliceApi.getContactGroups();
        return (
            existing[0] ??
            (await aliceApi.createGroup(
                "ignored by backend",
                others.map((other) => other._id),
            ))
        );
    } finally {
        await Promise.all(apis.map((api) => api.dispose()));
    }
}

interface Recorded {
    actor: Actor;
    /** When the recording started, roughly: the page (and its video) exists. */
    startedAt: number;
}

async function openRecorded(
    browser: Browser,
    user: TestUser,
    videoDir: string,
    size: { width: number; height: number },
): Promise<Recorded> {
    const actor = await openSignedInActor(browser, user, {
        recordVideo: { dir: videoDir, size },
    });
    const startedAt = Date.now();
    await actor.context.addInitScript(FAKE_CURSOR);
    await actor.dashboard.goto();
    return { actor, startedAt };
}

async function openCleanChat(actor: Actor, contactName: string) {
    const { sidebar, chat } = actor.dashboard;
    await sidebar.openChat(contactName);
    await expect(chat.messageInput).toBeVisible();
    if ((await chat.messages.count()) > 0) {
        await chat.emptyChat();
        await expect(chat.messages).toHaveCount(0);
        await expect(actor.dashboard.snackbar(/deleted/)).toBeHidden({
            timeout: 15_000,
        });
    }
}

/** Clicks the message input, then glides the cursor aside so it doesn't cover the text. */
async function focusMessageInput(actor: Actor) {
    const input = actor.dashboard.chat.messageInput;
    await input.click();
    const box = await input.boundingBox();
    if (box) {
        await actor.page.mouse.move(box.x + box.width - 30, box.y - 50, {
            steps: 12,
        });
    }
}

async function typeAndSend(actor: Actor, text: string) {
    const { chat } = actor.dashboard;
    await focusMessageInput(actor);
    await chat.messageInput.pressSequentially(text, { delay: TYPING_DELAY_MS });
    await actor.page.waitForTimeout(300);
    await chat.messageInput.press("Enter");
    await expect(
        chat.message(text).last().getByTestId("message-sent"),
    ).toBeVisible();
}

test("README demo", async ({ browser }, testInfo) => {
    const viewport = testInfo.project.use.viewport ?? {
        width: 800,
        height: 720,
    };
    const videoDir = testInfo.outputPath("videos");
    const aliceUser = await demoUser("Alice");
    const bobUser = await demoUser("Bob");
    const carolUser = await demoUser("Carol");
    const everyone = [aliceUser, bobUser, carolUser];
    for (const user of everyone) {
        await setDefaultAvatar(
            browser,
            user,
            AVATAR_OF[user.username as keyof typeof AVATAR_OF],
        );
    }
    const group = await setUpContactsAndGroup(everyone);
    const groupName = groupNameFor(aliceUser, everyone);
    const carol = await ApiClient.create(carolUser);

    const alice = await openRecorded(browser, aliceUser, videoDir, viewport);
    const bob = await openRecorded(browser, bobUser, videoDir, viewport);
    const a = alice.actor;
    const b = bob.actor;

    try {
        // --- Setup, cut from the GIF ---
        // Recent messages in Carol's chat and the group, so both sit above Bob in
        // Alice's list (it's sorted by the latest message) until the scene starts.
        await carol.sendMessage(
            aliceUser._id,
            "Thanks for the book tip, loved it! 📚",
        );
        await carol.sendMessage(group._id, "Who's in for dinner on Friday? 🍝");
        await openCleanChat(a, bobUser.username);
        await openCleanChat(b, aliceUser.username);
        // Start both from a fresh page load so neither shows stale state.
        for (const [actor, name] of [
            [a, bobUser.username],
            [b, aliceUser.username],
        ] as const) {
            await actor.page.reload();
            await actor.dashboard.sidebar.openChat(name);
            await expect(actor.dashboard.chat.messages).toHaveCount(0);
            await actor.page.mouse.move(
                viewport.width / 2,
                viewport.height - 120,
            );
        }
        const { sidebar } = a.dashboard;
        await expect(
            sidebar.contact(bobUser.username).getByTestId("online-indicator"),
        ).toBeVisible();
        await expect(sidebar.contact(groupName)).toContainText("dinner");
        await expect(sidebar.contacts).toHaveCount(3);

        // --- Scene ---
        const sceneStart = Date.now();
        await a.page.waitForTimeout(1200);

        const hello = "Hey Bob! Are you joining us tonight? 🎉";
        await focusMessageInput(a);
        await a.dashboard.chat.messageInput.pressSequentially(
            hello.slice(0, 12),
            { delay: TYPING_DELAY_MS },
        );
        await expect(b.dashboard.chat.typingIndicator).toBeVisible();
        await a.dashboard.chat.messageInput.pressSequentially(hello.slice(12), {
            delay: TYPING_DELAY_MS,
        });
        await a.page.waitForTimeout(300);
        await a.dashboard.chat.messageInput.press("Enter");
        await expect(b.dashboard.chat.message("Hey Bob!")).toBeVisible();
        await expect(
            a.dashboard.chat.message("Hey Bob!").getByTestId("message-read"),
        ).toBeVisible();
        await a.page.waitForTimeout(1200);

        await typeAndSend(b, "Sure, count me in! Have you seen our new logo?");
        await expect(a.dashboard.chat.message("count me in")).toBeVisible();

        await b.page.waitForTimeout(800);

        await b.dashboard.chat.attachImage(IMAGE_TO_SHARE);
        const received = a.dashboard.chat.messages.and(
            a.page.locator('[data-message-type="image"]'),
        );
        await expect(received).toHaveCount(1);
        await a.page.waitForTimeout(800);
        await received.getByRole("button", { name: "Show Image" }).click();
        await expect(received.locator("img")).toBeVisible();
        await a.page.waitForTimeout(1000);

        await typeAndSend(a, "Love it 😍 See you later!");
        await expect(b.dashboard.chat.message("See you later")).toBeVisible();
        await a.page.waitForTimeout(2500);
        const sceneEnd = Date.now();

        fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
        const manifest = {
            durationSeconds: (sceneEnd - sceneStart) / 1000,
            videos: [] as { path: string; offsetSeconds: number }[],
        };
        for (const { actor, startedAt } of [alice, bob]) {
            const video = actor.page.video();
            if (!video) throw new Error("No video recorded");
            await actor.context.close(); // writes the video file
            manifest.videos.push({
                path: await video.path(),
                offsetSeconds: (sceneStart - startedAt) / 1000,
            });
        }
        fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
    } finally {
        await carol.dispose();
        for (const { actor } of [alice, bob]) {
            await actor.api.dispose();
            await actor.context.close();
        }
    }
});
