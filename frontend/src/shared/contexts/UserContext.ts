import { createContext, Dispatch, SetStateAction } from "react";
import { User } from "../types/User";

export const UserContext = createContext<
    [User | undefined, Dispatch<SetStateAction<User | undefined>>]
>([undefined, () => {}]);
