import { initClient } from "@ts-rest/core";
import { BACKEND_URL, LOCAL_STORAGE_AUTH_KEY } from "../../environment";
import { Contact, contactContract } from "@t/contact.contract";
import { UserService } from "./UserService";
import { UserFactory } from "../factories/user.factory";

export class ContactService {
    private client;

    constructor(private readonly userService: UserService) {
        this.client = initClient(contactContract, {
            baseUrl: BACKEND_URL,
            baseHeaders: {
                Authorization:
                    "Bearer " + localStorage.getItem(LOCAL_STORAGE_AUTH_KEY),
            },
        });
    }

    async getContacts(userId: string): Promise<Contact[]> {
        const res = await this.client.getContacts({ body: { userId } });

        if (res.status === 200) {
            let initializedContacts = [];
            for (const contact of res.body) {
                initializedContacts.push(
                    await UserFactory.createUserWithAvatarBytes(
                        contact,
                        this.userService,
                    ),
                );
            }
            return initializedContacts;
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
