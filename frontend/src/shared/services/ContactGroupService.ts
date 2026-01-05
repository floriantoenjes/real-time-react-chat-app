import { ContactGroup, contactGroupContract } from "@t/contact-group.contract";
import { ClientService } from "./ClientService";

export class ContactGroupService {
    constructor(private readonly clientService: ClientService) {}

    async getContactGroups(userId: string): Promise<ContactGroup[]> {
        const messages = await this.clientService
            .getClient(contactGroupContract)
            .getContactGroups({
                body: { userId },
            });

        if (messages.status === 200) {
            return messages.body;
        }

        return [];
    }

    async addContactGroup(
        userId: string,
        groupName: string,
        memberIds: string[],
    ) {
        const result = await this.clientService
            .getClient(contactGroupContract)
            .addContactGroup({
                body: { userId, name: groupName, memberIds },
            });
        if (result.status !== 201) {
            return false;
        }

        return result.body;
    }

    async deleteContactGroup(userId: string, contactGroup: ContactGroup) {
        const result = await this.clientService
            .getClient(contactGroupContract)
            .removeContactGroup({
                body: { userId, contactGroupId: contactGroup._id },
            });
        if (result.status !== 204) {
            return false;
        }

        return result.body;
    }
}
