import { initClient } from "@ts-rest/core";
import { contract } from "../contract";
import { BACKEND_URL } from "../../environment";

export class MessageService {
    client;

    constructor() {
        this.client = initClient(contract, {
            baseUrl: BACKEND_URL,
            baseHeaders: {},
        });
    }

    async getMessages(userId: string, contactId: string) {
        const messages = await this.client.getMessages({
            body: { userId, contactId },
        });

        if (messages.status === 200) {
            return messages.body;
        }

        return [];
    }

    deleteMessages(username: string) {
        void this.client.deleteMessages({ body: { username } });
    }

    sendMessage(userIdAuthor: string, message: string, contactId: string) {
        return this.client.sendMessage({
            body: {
                userIdAuthor,
                message,
                from: contactId,
            },
        });
    }
}
