import { ClientService } from "./ClientService";
import { ignoredUserContract } from "@t/ignored-user.contract";

export class IgnoredUserService {
    constructor(private readonly clientService: ClientService) {}

    async ignoreUser(ignoredUserId: string) {
        return this.clientService
            .getClient(ignoredUserContract)
            .ignoreUser({ body: { ignoredUserId } });
    }

    async unignoreUser(ignoredUserId: string) {
        return this.clientService
            .getClient(ignoredUserContract)
            .unignoreUser({ body: { ignoredUserId } });
    }

    async getIgnoredUsers(page?: number, limit?: number) {
        const res = await this.clientService
            .getClient(ignoredUserContract)
            .getIgnoredUsers({ query: { page, limit } });
        if (res.status !== 200) {
            return false;
        }

        return res.body;
    }

    async ignoreFromContactRequest(contactRequestId: string) {
        return this.clientService
            .getClient(ignoredUserContract)
            .ignoreFromContactRequest({ body: { contactRequestId } });
    }
}
