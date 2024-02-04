import { initClient } from "@ts-rest/core";
import { contract } from "../contract";
import { BACKEND_URL } from "../../environment";
import { User } from "../types/User";

export class UserService {
    client;

    constructor() {
        this.client = initClient(contract, {
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
}
