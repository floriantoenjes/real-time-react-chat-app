import { UserService } from "./UserService";
import {
    LOCAL_STORAGE_AUTH_KEY,
    LOCAL_STORAGE_REFRESH_TOKEN,
} from "../../environment";
import { ClientService } from "./ClientService";

export class AuthService {
    constructor(
        private readonly clientService: ClientService,
        private readonly userService: UserService,
    ) {}

    async signIn(email: string, password: string) {
        const body = await this.userService.signIn(email, password);
        if (!body) {
            return;
        }
        localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, body.accessToken);

        return body.user;
    }

    async refresh() {
        const jwt =
            localStorage.getItem(LOCAL_STORAGE_AUTH_KEY) ??
            localStorage.getItem(LOCAL_STORAGE_REFRESH_TOKEN);
        if (!jwt) {
            return;
        }
        const res = await this.userService.refresh(jwt);
        if (!res) {
            return;
        }
        localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, res.accessToken);
        localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN, res.refreshToken);

        return res.user;
    }

    async signUp(email: string, password: string, username: string) {
        return this.userService.signUp(email, password, username);
    }
}
