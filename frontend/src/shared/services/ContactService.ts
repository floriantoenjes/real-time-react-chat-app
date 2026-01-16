import { Contact, contactContract } from "@t/contact.contract";
import { UserService } from "./UserService";
import { UserFactory } from "../factories/user.factory";
import { ClientService } from "./ClientService";
import { ContactGroup } from "@t/contact-group.contract";

export class ContactService {
    constructor(
        private readonly clientService: ClientService,
        private readonly userService: UserService,
    ) {}

    async getContacts(): Promise<Contact[]> {
        const res = await this.clientService
            .getClient(contactContract)
            .getContacts({ body: {} });

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

    async addContact(newContactId: string) {
        return this.clientService
            .getClient(contactContract)
            .addContact({ body: { newContactId } });
    }

    async deleteContact(contact: Contact | ContactGroup) {
        return await this.clientService
            .getClient(contactContract)
            .removeContact({ body: { contactId: contact._id } });
    }

    async getContactsOnlineStatus(contactIds: string[]) {
        return await this.clientService
            .getClient(contactContract)
            .getContactsOnlineStatus({ body: contactIds });
    }
}
