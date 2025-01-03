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
            baseHeaders: {
                Authorization: string;
            };
        }
    > {
        if (this.contractClientMap.get(contract)) {
            return this.contractClientMap.get(contract);
        }

        const client = initClient(contract, {
            baseUrl: BACKEND_URL,
            api: this.getCustomFetchApi(),
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
            const accessToken = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);

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
                const newAccessToken = await this.refreshAccessToken();

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
            body: JSON.stringify({
                accessToken:
                    localStorage.getItem(LOCAL_STORAGE_AUTH_KEY) ??
                    "dummy-token",
                refreshToken:
                    localStorage.getItem(LOCAL_STORAGE_REFRESH_TOKEN) ??
                    "dummy-refresh-token",
            }),
        });

        if (!response.ok) {
            AuthService.signOut(() => window.location.reload());
            return;
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await response.json();

        AuthService.setSignInData(newAccessToken, newRefreshToken);

        return newAccessToken;
    }

    clearBearerTokenAndClients() {
        this.contractClientMap = new Map();
    }
}
