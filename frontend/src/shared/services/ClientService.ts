import {
    AppRoute,
    AppRouteFunction,
    AppRouter,
    initClient,
    InitClientArgs,
} from "@ts-rest/core";
import { BACKEND_URL, LOCAL_STORAGE_AUTH_KEY } from "../../environment";

type RecursiveProxyObj<T, TClientArgs extends InitClientArgs> = {
    [TKey in keyof T]: T[TKey] extends AppRoute
        ? AppRouteFunction<T[TKey], TClientArgs>
        : T[TKey] extends AppRouter
          ? RecursiveProxyObj<T[TKey], TClientArgs>
          : never;
};

export class ClientService {
    private contractClientMap: Map<any, any> = new Map();

    getClient<T extends AppRouter>(
        contract: T,
    ): RecursiveProxyObj<
        T,
        {
            baseUrl: string;
            baseHeaders: {
                Authorization: string;
            };
        }
    > {
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

        const clientInMap = this.contractClientMap.get(contract);
        if (!clientInMap) {
            throw new Error("TS-Rest client not found in Map!");
        }
        return clientInMap;
    }

    clearBearerTokenAndClients() {
        this.contractClientMap = new Map();
    }
}
