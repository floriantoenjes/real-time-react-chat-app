import {
    AppRoute,
    AppRouteFunction,
    AppRouter,
    initClient,
    InitClientArgs,
} from "@ts-rest/core";
import {
    BACKEND_URL,
    LOCAL_STORAGE_AUTH_KEY,
    LOCAL_STORAGE_REFRESH_TOKEN,
} from "../../environment";

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

        let accessToken = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);

        const refreshAccessToken = async () => {
            const response = await fetch(`${BACKEND_URL}/refresh`, {
                method: "POST",
                body: JSON.stringify({
                    accessToken: accessToken,
                    refreshToken: localStorage.getItem(
                        LOCAL_STORAGE_REFRESH_TOKEN,
                    ),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to refresh access token");
            }

            const {
                access_token: newAccessToken,
                refresh_token: newRefreshToken,
            } = await response.json();
            accessToken = newAccessToken;
            localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, newAccessToken);
            localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN, newRefreshToken);

            return newAccessToken;
        };

        const client = initClient(contract, {
            baseUrl: BACKEND_URL,
            api: async (args) => {
                const { path, method, headers, body, fetchOptions } = args;

                const requestOptions: RequestInit = {
                    method,
                    headers: {
                        ...headers,
                        Authorization: `Bearer ${accessToken}`, // Always use the latest token
                    },
                    body: body ?? undefined,
                    ...fetchOptions,
                };

                const response = await fetch(path, requestOptions);

                if (response.status === 401) {
                    console.log("Access token expired, attempting refresh...");
                    const newAccessToken = await refreshAccessToken();

                    // Retry the original request with the new token
                    // @ts-ignore
                    requestOptions!.headers!.Authorization = `Bearer ${newAccessToken}`;
                    const refreshResponse = await fetch(path, requestOptions);

                    return {
                        status: refreshResponse.status,
                        body: await refreshResponse.json(),
                        headers: refreshResponse.headers,
                    };
                }

                return {
                    status: response.status,
                    body: await response.json(),
                    headers: response.headers,
                };
            },
        });

        this.contractClientMap.set(contract, client);

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
