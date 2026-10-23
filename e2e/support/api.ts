import { APIRequestContext, expect, request } from "@playwright/test";
import type { User } from "../../backend/shared/user.contract";
import type { Contact } from "../../backend/shared/contact.contract";
import type { ContactGroup } from "../../backend/shared/contact-group.contract";
import type {
    Message,
    MessageType,
} from "../../backend/shared/message.contract";
import { BACKEND_URL } from "./urls";
import { DEFAULT_PASSWORD, uniqueEmail, uniqueUsername } from "./ids";

export interface TestUser {
    _id: string;
    username: string;
    email: string;
    password: string;
    accessToken: string;
    refreshToken: string;
}

/** Registers a fresh user and signs it in, all through the REST API. */
export async function createUser(namePrefix?: string): Promise<TestUser> {
    const username = uniqueUsername(namePrefix);
    const email = uniqueEmail(username);
    const password = DEFAULT_PASSWORD;

    const anonymous = await request.newContext({ baseURL: BACKEND_URL });
    try {
        const signUp = await anonymous.post("/register", {
            data: { email, password, username },
        });
        expect(signUp.status(), await signUp.text()).toBe(201);

        const signIn = await anonymous.post("/login", {
            data: { email, password },
        });
        expect(signIn.status(), await signIn.text()).toBe(200);
        const { accessToken, refreshToken } = await signIn.json();

        const api = await ApiClient.create({ accessToken });
        try {
            const user = await api.getSignedInUser();
            return {
                _id: user._id,
                username,
                email,
                password,
                accessToken,
                refreshToken,
            };
        } finally {
            await api.dispose();
        }
    } finally {
        await anonymous.dispose();
    }
}

/**
 * Authenticated REST client for fast test setup. The backend only reads the
 * access token from the `accessToken` cookie.
 */
export class ApiClient {
    private constructor(private readonly context: APIRequestContext) {}

    static async create(user: Pick<TestUser, "accessToken">) {
        const context = await request.newContext({
            baseURL: BACKEND_URL,
            extraHTTPHeaders: { cookie: `accessToken=${user.accessToken}` },
        });
        return new ApiClient(context);
    }

    async dispose() {
        await this.context.dispose();
    }

    async getSignedInUser(): Promise<User> {
        return this.expectJson(await this.context.get("/signed-in-user"), 200);
    }

    async addContact(contactId: string): Promise<Contact> {
        return this.expectJson(
            await this.context.put("/contacts", {
                data: { newContactId: contactId },
            }),
            201,
        );
    }

    async createGroup(
        name: string,
        memberIds: string[],
    ): Promise<ContactGroup> {
        return this.expectJson(
            await this.context.put("/contact-groups", {
                data: { name, memberIds },
            }),
            201,
        );
    }

    async sendMessage(
        toUserId: string,
        message: string,
        type: MessageType = "text",
    ): Promise<Message> {
        return this.expectJson(
            await this.context.post("/send", {
                data: { toUserId, message, type },
            }),
            201,
        );
    }

    private async expectJson<T>(
        response: Awaited<ReturnType<APIRequestContext["get"]>>,
        status: number,
    ): Promise<T> {
        expect(
            response.status(),
            `${response.url()}: ${await response.text()}`,
        ).toBe(status);
        return (await response.json()) as T;
    }
}
