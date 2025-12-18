import { ClientService } from "./ClientService";
import { coturnContract } from "@t/coturn.contract";

export class CoturnService {
    constructor(private readonly clientService: ClientService) {}

    async getCredentials(userId: string) {
        const response = await this.clientService
            .getClient(coturnContract)
            .getCredentials({ body: { userId } });

        if (response.status !== 200) {
            throw new Error(`Error creating coturn credentials!`);
        }

        return response.body;
    }
}
