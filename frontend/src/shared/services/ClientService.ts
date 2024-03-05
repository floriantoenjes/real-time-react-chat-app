import { initClient } from "@ts-rest/core";
import { BACKEND_URL, LOCAL_STORAGE_AUTH_KEY } from "../../environment";

export class ClientService {
    private contractClientMap: Map<any, any> = new Map();

    getClient(contract: any) {
        if (this.contractClientMap.get(contract)) {
            return this.contractClientMap.get(contract);
        }

        this.contractClientMap.set(
            contract,
            initClient(contract, {
                baseUrl: BACKEND_URL,
                baseHeaders: {
                    Authorization:
                        "Bearer " +
                        localStorage.getItem(LOCAL_STORAGE_AUTH_KEY),
                },
            }),
        );

        return this.contractClientMap.get(contract);
    }

    clearBearerTokenAndClients() {
        this.contractClientMap = new Map();
    }
}
