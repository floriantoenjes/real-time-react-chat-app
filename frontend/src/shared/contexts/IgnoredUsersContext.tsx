import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from "react";
import { useDiContext } from "./DiContext";
import { SocketContext } from "./SocketContext";
import { SocketMessageTypes } from "@t/socket-message-types.enum";
import { UserContext } from "./UserContext";

export const IgnoredUsersContext = createContext<{
    ignoredUserIds: [string[], Dispatch<SetStateAction<string[]>>];
}>({
    ignoredUserIds: [[], () => {}],
});

export function IgnoredUsersProvider({ children }: { children: ReactNode }) {
    const { IgnoredUserService: ignoredUserService } = useDiContext();

    const [socket] = useContext(SocketContext);
    const [user] = useContext(UserContext);

    const [ignoredUserIds, setIgnoredUserIds] = useState<string[]>([]);

    // Fetch ignored users on mount and when user changes
    useEffect(() => {
        (async () => {
            if (!user?._id) {
                setIgnoredUserIds([]);
                return;
            }
            const response = await ignoredUserService.getIgnoredUsers();
            if (response.status === 200) {
                setIgnoredUserIds(response.body.data);
            }
        })();
    }, [user?._id]);

    // Handle WebSocket events for ignore status updates
    useEffect(() => {
        if (!socket || !user?._id) {
            return;
        }

        const handleUserIgnored = (ignoredUserId: string) => {
            setIgnoredUserIds((prev) => {
                // Only add if not already in the list
                if (!prev.includes(ignoredUserId)) {
                    return [...prev, ignoredUserId];
                }
                return prev;
            });
        };

        const handleUserUnignored = (unignoredUserId: string) => {
            setIgnoredUserIds((prev) => {
                return prev.filter((id) => id !== unignoredUserId);
            });
        };

        socket.on(SocketMessageTypes.userIgnored, handleUserIgnored);
        socket.on(SocketMessageTypes.userUnignored, handleUserUnignored);

        return () => {
            socket.off(SocketMessageTypes.userIgnored, handleUserIgnored);
            socket.off(SocketMessageTypes.userUnignored, handleUserUnignored);
        };
    }, [socket, user?._id]);

    return (
        <IgnoredUsersContext.Provider
            value={{
                ignoredUserIds: [ignoredUserIds, setIgnoredUserIds],
            }}
        >
            {children}
        </IgnoredUsersContext.Provider>
    );
}

export function useIgnoredUsersContext() {
    const context = useContext(IgnoredUsersContext);
    if (!context) {
        throw new Error(
            "useIgnoredUsersContext must be used within an IgnoredUsersProvider",
        );
    }
    return context;
}
