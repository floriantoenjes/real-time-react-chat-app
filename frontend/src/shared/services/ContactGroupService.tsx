import { initClient } from "@ts-rest/core";
import { BACKEND_URL } from "../../environment";
import {
    ContactGroup,
    contactGroupContract,
} from "real-time-chat-backend/dist/shared/contact-group.contract";

export class ContactGroupService {
    private client;

    constructor() {
        this.client = initClient(contactGroupContract, {
            baseUrl: BACKEND_URL,
            baseHeaders: {},
        });
    }

    async getContactGroups(userId: string): Promise<ContactGroup[]> {
        const messages = await this.client.getContactGroups({
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
        return await this.client.addContactGroup({
            body: { userId, groupName, memberIds },
        });
    }

    async deleteContactGroup(userId: string, contactGroupId: string) {
        return await this.client.removeContactGroup({
            body: { userId, contactGroupId },
        });
    }
}
