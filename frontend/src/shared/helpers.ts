import { Dispatch, SetStateAction } from "react";
import { User } from "@t/user.contract";
import { UserFactory } from "./factories/user.factory";
import { UserService } from "./services/UserService";

export const getSetUserWithAvatarBytes = (userService: UserService) => {
    return (setUser: Dispatch<SetStateAction<User | undefined>>) =>
        (user: User) => {
            UserFactory.createUserWithAvatarBytes(user, userService).then(
                (user) => {
                    setUser(user);
                },
            );
        };
};
