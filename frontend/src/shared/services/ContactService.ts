import { Contact, contactContract } from "@t/contact.contract";
import { UserService } from "./UserService";
import { UserFactory } from "../factories/user.factory";
import { ClientService } from "./ClientService";
import { SnackbarLevels, snackbarService } from "../contexts/SnackbarContext";
import { ContactGroup } from "@t/contact-group.contract";

export class ContactService {
    constructor(
        private readonly clientService: ClientService,
        private readonly userService: UserService,
    ) {}

    async getContacts(userId: string): Promise<Contact[]> {
        const res = await this.clientService
            .getClient(contactContract)
            .getContacts({ body: { userId } });

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
        const response = await this.clientService
            .getClient(contactContract)
            .addContact({ body: { userId, newContactId } });
        if (response.status !== 201) {
            snackbarService.showSnackbar(
                "Error adding contact",
                SnackbarLevels.ERROR,
            );
            return;
        }

        snackbarService.showSnackbar(
            `${response.body.name} has been added as a contact`,
            SnackbarLevels.SUCCESS,
        );
        return response.body;
    }

    async deleteContact(userId: string, contact: Contact | ContactGroup) {
        return await this.clientService
            .getClient(contactContract)
            .removeContact({ body: { userId, contactId: contact._id } });
    }

    async getContactsOnlineStatus(contactIds: string[]) {
        return await this.clientService
            .getClient(contactContract)
            .getContactsOnlineStatus({ body: contactIds });
    }
}
