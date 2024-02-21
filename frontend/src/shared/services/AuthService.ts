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

    async signUp(
        email: string,
        password: string,
        username: string,
        userService: UserService,
    ) {
        return userService.signUp(email, password, username);
    },
};
