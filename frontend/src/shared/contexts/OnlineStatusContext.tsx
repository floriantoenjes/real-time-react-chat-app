import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
} from "react";
import { SocketContext } from "./SocketContext";
import { useDiContext } from "./DiContext";
import { SocketMessageTypes } from "@t/socket-message-types.enum";

interface OnlineStatusContextType {
    contactsOnlineStatus: Map<string, boolean>;
    isContactOnline: (contactId: string) => boolean;
}

export const OnlineStatusContext = createContext<OnlineStatusContextType>({
    contactsOnlineStatus: new Map<string, boolean>(),
    isContactOnline: () => false,
});

export function useOnlineStatus() {
    return useContext(OnlineStatusContext);
}

interface OnlineStatusProviderProps {
    children: React.ReactNode;
    contactIds: string[];
}

export function OnlineStatusProvider({
    children,
    contactIds,
}: OnlineStatusProviderProps) {
    const [contactsOnlineStatus, setContactsOnlineStatus] = useState<
        Map<string, boolean>
    >(new Map<string, boolean>());

    const [socket] = useContext(SocketContext);
    const contactService = useDiContext().ContactService;

    const setContactOnlineStatusOnOrOffline = useCallback(
        (contactId: string, onlineStatus: boolean) => {
            setContactsOnlineStatus((prevState) => {
                prevState.set(contactId, onlineStatus);
                return new Map(prevState);
            });
        },
        [],
    );

    useEffect(() => {
        if (!contactIds.length) {
            return;
        }

        (async () => {
            const res =
                await contactService.getContactsOnlineStatus(contactIds);
            if (res.status !== 200) {
                return;
            }
            const onlineStatusMap = new Map<string, boolean>();
            for (const userId of Object.keys(res.body)) {
                onlineStatusMap.set(userId, res.body[userId]);
            }
            setContactsOnlineStatus(onlineStatusMap);
        })();
    }, [contactIds, contactService]);

    useEffect(() => {
        if (!socket) {
            return;
        }

        const handleContactOnline = (contactId: string) => {
            setContactOnlineStatusOnOrOffline(contactId, true);
        };

        const handleContactOffline = (contactId: string) => {
            setContactOnlineStatusOnOrOffline(contactId, false);
        };

        socket.on(SocketMessageTypes.contactOnline, handleContactOnline);
        socket.on(SocketMessageTypes.contactOffline, handleContactOffline);

        return () => {
            socket.off(SocketMessageTypes.contactOnline, handleContactOnline);
            socket.off(SocketMessageTypes.contactOffline, handleContactOffline);
        };
    }, [socket, setContactOnlineStatusOnOrOffline]);

    const isContactOnline = useCallback(
        (contactId: string): boolean => {
            return contactsOnlineStatus.get(contactId) ?? false;
        },
        [contactsOnlineStatus],
    );

    const value = useMemo(
        () => ({
            contactsOnlineStatus,
            isContactOnline,
        }),
        [contactsOnlineStatus, isContactOnline],
    );

    return (
        <OnlineStatusContext.Provider value={value}>
            {children}
        </OnlineStatusContext.Provider>
    );
}
