import { initClient } from "@ts-rest/core";
import { BACKEND_URL } from "../../environment";
import { User, userContract } from "@t/user.contract";

export class UserService {
    client;

    constructor() {
        this.client = initClient(userContract, {
            baseUrl: BACKEND_URL,
            baseHeaders: {},
        });
    }

    async signIn(email: string, password: string): Promise<User | false> {
        const res = await this.client.signIn({
            body: { email, password },
        });

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

    async uploadAvatar(file: File, userId: string) {
        await this.client.uploadAvatar({ body: { avatar: file, userId } });
    }

    async loadAvatar(userId: string) {
        const res = (await this.client.loadAvatar({
            params: { userId },
        })) as any;

        return btoa(
            new Uint8Array(res.body.data).reduce(function (data, byte) {
                return data + String.fromCharCode(byte);
            }, ""),
        );
    }
}
