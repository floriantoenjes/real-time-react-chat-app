import { Dispatch, SetStateAction } from "react";
import { User } from "@t/user.contract";
import { UserFactory } from "./factories/user.factory";
import { UserService } from "./services/UserService";

export const getSetUserWithAvatarBytes = (userService: UserService) => {
    return (setUser: Dispatch<SetStateAction<User | undefined>>) =>
        (user: SetStateAction<User | undefined>) => {
            user = user as User;
            UserFactory.createUserWithAvatarBytes(user, userService).then(
                (user) => {
                    setUser(user);
                },
            );
        };
};
