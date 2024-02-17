import { initClient } from "@ts-rest/core";
import { BACKEND_URL } from "../../environment";
import { Contact, contactContract } from "@t/contact.contract";

export class ContactService {
    private client;

    constructor() {
        this.client = initClient(contactContract, {
            baseUrl: BACKEND_URL,
            baseHeaders: {},
        });
    }

    async getContacts(userId: string): Promise<Contact[]> {
        const messages = await this.client.getContacts({ body: { userId } });

        if (messages.status === 200) {
            return messages.body;
        }

        return [];
    }

    async addContact(userId: string, newContactId: string) {
        return await this.client.addContact({ body: { userId, newContactId } });
    }

    async deleteContact(userId: string, contactId: string) {
        return await this.client.removeContact({ body: { userId, contactId } });
    }
}
