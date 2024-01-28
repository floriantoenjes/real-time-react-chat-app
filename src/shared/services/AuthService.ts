import { users } from "../../data/users";

export const AuthService = {
    signIn(email: string, password: string) {
        const user = users.find(
            (user) => user.email === email && user.password === password,
        );

        if (!user) {
            return false;
        }

        return user;
    },
};
