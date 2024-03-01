import { UserService } from "./UserService";
import { LOCAL_STORAGE_AUTH_KEY } from "../../environment";

export class AuthService {
    constructor(private readonly userService: UserService) {}

    async signIn(email: string, password: string) {
        const body = await this.userService.signIn(email, password);
        if (!body) {
            return;
        }
        localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, body.access_token);

        return body.user;
    }

    async refresh() {
        const jwt = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
        if (!jwt) {
            return;
        }
        const res = await this.userService.refresh(jwt);
        if (!res) {
            return;
        }
        localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, res.access_token);

        return res.user;
    }

    async signUp(email: string, password: string, username: string) {
        return this.userService.signUp(email, password, username);
    }
}
