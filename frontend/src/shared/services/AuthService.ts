import { UserService } from "./UserService";

export const AuthService = {
    signIn(email: string, password: string, userService: UserService) {
        return userService.signIn(email, password);
    },

    signUp(
        email: string,
        password: string,
        username: string,
        userService: UserService,
    ) {
        return userService.signUp(email, password, username);
    },
};
