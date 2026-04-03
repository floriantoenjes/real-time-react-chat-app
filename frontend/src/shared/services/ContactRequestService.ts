import { ClientService } from "./ClientService";
import { contactRequestContract } from "@t/contact-request.contract";

export class ContactRequestService {
    constructor(private readonly clientService: ClientService) {}

    async getContactRequestByInitiatorId(initiatorId: string) {
        const result = await this.clientService
            .getClient(contactRequestContract)
            .getContactRequestByInitiatorId({ body: { initiatorId } });

        if (result.status !== 200) {
            return false;
        }

        return result.body;
    }

    async respondToContactRequest(contactRequestId: string, accepted: boolean) {
        const result = await this.clientService
            .getClient(contactRequestContract)
            .respondToContactRequest({ body: { contactRequestId, accepted } });
        if (result.status !== 200) {
            return false;
        }

        return;
    }
}
