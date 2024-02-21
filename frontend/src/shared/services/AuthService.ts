import { UserService } from "./UserService";
import { LOCAL_STORAGE_AUTH_KEY } from "../../environment";

export const AuthService = {
    async signIn(email: string, password: string, userService: UserService) {
        const body = await userService.signIn(email, password);
        if (!body) {
            return;
        }
        localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, body.access_token);

        return body.user;
    },

    async refresh(userService: UserService) {
        const jwt = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
        if (!jwt) {
            return;
        }
        const res = await userService.refresh(jwt);
        if (!res) {
            return;
        }
        localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, res.access_token);

        return res.user;
    },

    async signUp(
        email: string,
        password: string,
        username: string,
        userService: UserService,
    ) {
        return userService.signUp(email, password, username);
    },
};
