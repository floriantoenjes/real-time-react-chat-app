import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { User } from "real-time-chat-backend/shared/user.contract";
import { useDiContext } from "./DiContext";
import { getSetUserWithAvatarBytesOptional } from "../helpers";

export const UserContext = createContext<
    [User | undefined, Dispatch<SetStateAction<User | undefined>>]
>([undefined, () => {}]);

export function useUserContext(): [User, (user: User) => void] {
    const [user, setUser] = useContext(UserContext);
    if (!user) {
        throw new Error("User must be set in order to use the UserContext!");
    }
    return [user, setUser];
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User>();

    const { AuthService: authService, UserService: userService } =
        useDiContext();

    const setUserWithAvatarBytes =
        getSetUserWithAvatarBytesOptional(userService);

    const memoizedSetUser = useCallback(
        (newUser: User | undefined) => {
            if (newUser) {
                setUserWithAvatarBytes(setUser)(newUser);
            } else {
                setUser(undefined);
            }
        },
        [userService],
    );

    const userContextValue = useMemo(
        (): [User | undefined, Dispatch<SetStateAction<User | undefined>>] => [
            user,
            memoizedSetUser as Dispatch<SetStateAction<User | undefined>>,
        ],
        [user, memoizedSetUser],
    );

    useEffect(() => {
        void authService.authenticateUserAndFetchAvatar(
            user,
            setUserWithAvatarBytes,
            setUser,
        );
    }, [user?._id]);

    return (
        <UserContext.Provider value={userContextValue}>
            {children}
        </UserContext.Provider>
    );
};
