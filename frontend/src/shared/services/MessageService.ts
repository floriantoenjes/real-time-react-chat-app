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

    async getMessages(username: string) {
        const messages = await this.client.getMessages({ body: { username } });

        if (messages.status === 200) {
            return messages.body;
        }

        return [];
    }

    deleteMessages(username: string) {
        void this.client.deleteMessages({ body: { username } });
    }

    sendMessage(message: string, fromUsername: string) {
        return this.client.sendMessage({
            body: {
                message,
                from: fromUsername,
            },
        });
    }
}
