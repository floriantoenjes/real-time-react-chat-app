import { createContext, Dispatch, SetStateAction, useContext } from "react";
import { User } from "real-time-chat-backend/shared/user.contract";

export const UserContext = createContext<
    [User | undefined, Dispatch<SetStateAction<User | undefined>>]
>([undefined, () => {}]);

export function useUserContext(): [
    User,
    Dispatch<SetStateAction<User | undefined>>,
] {
    const [user, setUser] = useContext(UserContext);
    if (!user) {
        throw new Error("User must be set in order to use the UserContext!");
    }
    return [user, setUser];
}
