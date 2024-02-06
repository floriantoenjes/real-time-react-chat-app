import { createContext, Dispatch, SetStateAction, useContext } from "react";
import { UserService } from "../services/UserService";
import { User } from "backend/shared/contact.contract";

export const UserContext = createContext<
    [User | undefined, Dispatch<SetStateAction<User | undefined>>, UserService]
>([undefined, () => {}, new UserService()]);

export function useUserContext(): [
    User,
    Dispatch<SetStateAction<User | undefined>>,
    UserService,
] {
    const [user, setUser, userService] = useContext(UserContext);
    if (!user) {
        throw new Error("User must be set in order to use the UserContext!");
    }
    return [user, setUser, userService];
}
