import { UserService } from "./UserService";
import {
    LOCAL_STORAGE_AUTH_KEY,
    LOCAL_STORAGE_REFRESH_TOKEN,
} from "../../environment";
import { snackbarService } from "../contexts/SnackbarContext";

export class AuthService {
    constructor(private readonly userService: UserService) {}

    static setSignInData(accessToken: string, refreshToken: string) {
        localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, accessToken);
        localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN, refreshToken);
    }

    static signOut(callback: () => void) {
        localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
        localStorage.removeItem(LOCAL_STORAGE_REFRESH_TOKEN);
        callback();
        snackbarService.showSnackbar("You have been logged out successfully");
    }

    async signIn(email: string, password: string) {
        const body = await this.userService.signIn(email, password);
        if (!body) {
            return;
        }
        AuthService.setSignInData(body.accessToken, body.refreshToken);

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
        AuthService.setSignInData(res.accessToken, res.refreshToken);

        return res.user;
    }

    async signUp(email: string, password: string, username: string) {
        return this.userService.signUp(email, password, username);
    }
}
