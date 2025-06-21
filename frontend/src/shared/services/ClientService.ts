import {
    AppRoute,
    AppRouteFunction,
    AppRouter,
    initClient,
    InitClientArgs,
} from "@ts-rest/core";
import { BACKEND_URL } from "../../environment";
import { AuthService } from "./AuthService";

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
            credentials: "include";
        }
    > {
        if (this.contractClientMap.get(contract)) {
            return this.contractClientMap.get(contract);
        }

        const client = initClient(contract, {
            baseUrl: BACKEND_URL,
            api: this.getCustomFetchApi(),
            credentials: "include",
        });

        this.contractClientMap.set(contract, client);

        const clientInMap = this.contractClientMap.get(contract);
        if (!clientInMap) {
            throw new Error("TS-Rest client not found in Map!");
        }
        return clientInMap;
    }

    private getCustomFetchApi() {
        return async (args: any) => {
            const { path, method, headers, body, fetchOptions } = args;

            const requestOptions: RequestInit = {
                method,
                headers: {
                    ...headers,
                },
                body: body ?? undefined,
                ...fetchOptions,
            };

            const response = await fetch(path, requestOptions);

            if (response.status === 401) {
                console.log("Access token expired, attempting refresh...");
                await this.refreshAccessToken();

                // Retry the original request with the new token
                // @ts-ignore
                const refreshResponse = await fetch(path, requestOptions);

                return {
                    status: refreshResponse.status,
                    body: response.headers.get("content-type")?.includes("json")
                        ? await response.json()
                        : await response.text(),
                    headers: refreshResponse.headers,
                };
            }

            return {
                status: response.status,
                body: response.headers.get("content-type")?.includes("json")
                    ? await response.json()
                    : await response.text(),
                headers: response.headers,
            };
        };
    }

    async refreshAccessToken() {
        const response = await fetch(`${BACKEND_URL}/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            await fetch(`${BACKEND_URL}/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
                credentials: "include",
            });
            return;
        }

        AuthService.setSignInData();
    }

    clearBearerTokenAndClients() {
        this.contractClientMap = new Map();
    }
}
