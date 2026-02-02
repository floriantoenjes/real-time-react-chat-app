import {
    AppRoute,
    AppRouteFunction,
    AppRouter,
    initClient,
    InitClientArgs,
} from "@ts-rest/core";
import { BACKEND_URL } from "../../environment";
import { AuthService } from "./AuthService";
import { SnackbarLevels, snackbarService } from "../contexts/SnackbarContext";
import { errorsEn } from "../../errors/i18n/errors-en";
import { getErrorTranslation } from "../../errors/i18n/error-i18n.utils";
import { Locales } from "../../i18n/i18n-types";

type RecursiveProxyObj<T, TClientArgs extends InitClientArgs> = {
    [TKey in keyof T]: T[TKey] extends AppRoute
        ? AppRouteFunction<T[TKey], TClientArgs>
        : T[TKey] extends AppRouter
          ? RecursiveProxyObj<T[TKey], TClientArgs>
          : never;
};

type Contract = AppRouter;
type CustomFetchApi = (args: any) => Promise<{
    status: number;
    body: any;
    headers: Headers;
}>;
type RestClient<T> = RecursiveProxyObj<
    T,
    { baseUrl: string; api: CustomFetchApi; credentials: "include" }
>;

export class ClientService {
    private contractClientMap = new Map<Contract, RestClient<AppRouter>>();

    getClient<T extends AppRouter>(contract: T): RestClient<T> {
        type ClientType = RestClient<T>;
        type MapValueType = RestClient<Contract>;

        const cached = this.contractClientMap.get(contract);
        if (cached) {
            return cached as ClientType;
        }

        const client = initClient(contract, {
            baseUrl: BACKEND_URL,
            api: this.getCustomFetchApi(),
            credentials: "include",
        });

        this.contractClientMap.set(contract, client as MapValueType);

        return client as ClientType;
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
            const responseBody = response.headers
                .get("content-type")
                ?.includes("json")
                ? await response.json()
                : await response.text();

            if (response.status === 401) {
                console.log("Access token expired, attempting refresh...");
                await this.refreshAccessToken();

                // Retry the original request with the new token
                const refreshResponse = await fetch(path, requestOptions);
                const refreshResponseBody = refreshResponse.headers
                    .get("content-type")
                    ?.includes("json")
                    ? await refreshResponse.json()
                    : await refreshResponse.text();

                await this.handleErrors(refreshResponseBody);

                return {
                    status: refreshResponse.status,
                    body: refreshResponseBody,
                    headers: refreshResponse.headers,
                };
            }

            await this.handleErrors(responseBody);

            return {
                status: response.status,
                body: responseBody,
                headers: response.headers,
            };
        };
    }

    private async handleErrors(errorObj: any) {
        if (errorObj.errorCode in errorsEn) {
            snackbarService.showSnackbar(
                getErrorTranslation(
                    errorObj.errorCode,
                    (localStorage.getItem("language") as Locales) ?? "en",
                ),
                SnackbarLevels.ERROR,
            );
        }
    }

    async refreshAccessToken() {
        const response = await fetch(`${BACKEND_URL}/refresh`, {
            method: "POST",
            credentials: "include",
        });

        if (!response.ok) {
            await fetch(`${BACKEND_URL}/logout`, {
                method: "POST",
                credentials: "include",
            });
            localStorage.setItem(
                AuthService.LOCAL_STORAGE_SIGNED_IN_FLAG,
                JSON.stringify(false),
            );
            window.location.reload();

            return;
        }

        AuthService.setSignInData();
    }

    clearBearerTokenAndClients() {
        this.contractClientMap = new Map();
    }
}
