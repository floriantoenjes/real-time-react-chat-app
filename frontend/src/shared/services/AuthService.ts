import { UserService } from "./UserService";

export const AuthService = {
    signIn(email: string, password: string, userService: UserService) {
        return userService.signIn(email, password);
    },
};
