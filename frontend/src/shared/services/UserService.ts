import { initClient } from "@ts-rest/core";
import { BACKEND_URL, LOCAL_STORAGE_AUTH_KEY } from "../../environment";
import { User, userContract } from "@t/user.contract";

export class UserService {
    client;

    constructor() {
        this.client = initClient(userContract, {
            baseUrl: BACKEND_URL,
            baseHeaders: {
                Authorization:
                    "Bearer " + localStorage.getItem(LOCAL_STORAGE_AUTH_KEY),
            },
        });
    }

    async getUsers() {
        const res = await this.client.getAll();

        if (res.status === 200) {
            return res.body;
        }

        return false;
    }

    async signIn(
        email: string,
        password: string,
    ): Promise<{ user: User; access_token: string } | false> {
        const res = await this.client.signIn({
            body: { email, password },
        });

        if (res.status === 200) {
            return res.body;
        }

        return false;
    }

    async refresh(
        accessToken: string,
    ): Promise<{ user: User; access_token: string } | false> {
        const res = await this.client.refresh({ body: { accessToken } });

        if (res.status === 200) {
            return res.body;
        }

        return false;
    }

    async signUp(
        email: string,
        password: string,
        username: string,
    ): Promise<User | false> {
        const res = await this.client.signUp({
            body: { email, password, username },
        });

        if (res.status === 201) {
            return res.body;
        }

        return false;
    }

    async searchForUserByUsername(username: string): Promise<User | false> {
        const res = await this.client.searchUserByUsername({
            body: { username },
        });

        if (res.status === 200) {
            return res.body;
        }

        return false;
    }

    async uploadAvatar(
        file: File,
        x: number,
        y: number,
        width: number,
        height: number,
        userId: string,
    ) {
        await this.client.uploadAvatar({
            body: { avatar: file, userId, x, y, width, height },
        });
    }

    async loadAvatar(userId: string) {
        const res = (await this.client.loadAvatar({
            params: { userId },
        })) as any;

        return btoa(
            new Uint8Array(Object.values(res.body)).reduce(function (
                data,
                byte,
            ) {
                return data + String.fromCharCode(byte);
            }, ""),
        );
    }
}
