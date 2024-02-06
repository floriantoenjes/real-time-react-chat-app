import { initClient } from "@ts-rest/core";
import { BACKEND_URL } from "../../environment";
import {
    User,
    userContract,
} from "real-time-chat-backend/dist/shared/user.contract";

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

    async searchForUserByUsername(username: string): Promise<User | false> {
        const res = await this.client.searchUserByUsername({
            body: { username },
        });

        if (res.status === 200) {
            return res.body;
        }

        return false;
    }
}
