import { ContactGroup, contactGroupContract } from "@t/contact-group.contract";
import { ClientService } from "./ClientService";

export class ContactGroupService {
    constructor(private readonly clientService: ClientService) {}

    async getContactGroups(): Promise<ContactGroup[]> {
        const messages = await this.clientService
            .getClient(contactGroupContract)
            .getContactGroups({
                body: {},
            });

        if (messages.status === 200) {
            return messages.body;
        }

        return [];
    }

    async addContactGroup(groupName: string, memberIds: string[]) {
        const result = await this.clientService
            .getClient(contactGroupContract)
            .addContactGroup({
                body: { name: groupName, memberIds },
            });
        // Handle both 200 (joined existing) and 201 (created new)
        if (result.status !== 200 && result.status !== 201) {
            return false;
        }

        return result.body;
    }

    async leaveContactGroup(groupId: string): Promise<boolean> {
        const result = await this.clientService
            .getClient(contactGroupContract)
            .leaveContactGroup({
                body: { contactGroupId: groupId },
            });

        return result.status === 200;
    }

    // TODO: Use later
    async rejoinContactGroup(groupId: string): Promise<ContactGroup | false> {
        const result = await this.clientService
            .getClient(contactGroupContract)
            .rejoinContactGroup({
                body: { contactGroupId: groupId },
            });

        if (result.status !== 200) {
            return false;
        }

        return result.body;
    }

    // TODO: Use later
    async getLeftGroups(): Promise<ContactGroup[]> {
        const result = await this.clientService
            .getClient(contactGroupContract)
            .getLeftGroups({
                body: {},
            });

        if (result.status === 200) {
            return result.body;
        }

        return [];
    }

    async deleteContactGroup(contactGroup: ContactGroup) {
        const result = await this.clientService
            .getClient(contactGroupContract)
            .removeContactGroup({
                body: { contactGroupId: contactGroup._id },
            });
        if (result.status !== 200) {
            return false;
        }

        return result.body;
    }
}
