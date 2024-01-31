import { initClient } from "@ts-rest/core";
import { contract } from "../contract";

export class MessageService {
    client;

    constructor() {
        this.client = initClient(contract, {
            baseUrl: "http://localhost:4200",
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

    sendMessage(message: string, fromUsername: string) {
        return this.client.sendMessage({
            body: {
                message,
                from: fromUsername,
            },
        });
    }
}
