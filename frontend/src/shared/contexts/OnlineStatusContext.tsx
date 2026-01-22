import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useEffectEvent,
    useMemo,
    useState,
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

    const onContactOnline = useEffectEvent((contactId: string) => {
        setContactsOnlineStatus((prevState) => {
            prevState.set(contactId, true);
            return new Map(prevState);
        });
    });

    const onContactOffline = useEffectEvent((contactId: string) => {
        setContactsOnlineStatus((prevState) => {
            prevState.set(contactId, false);
            return new Map(prevState);
        });
    });

    useEffect(() => {
        if (!socket) {
            return;
        }

        socket.on(SocketMessageTypes.contactOnline, onContactOnline);
        socket.on(SocketMessageTypes.contactOffline, onContactOffline);

        return () => {
            socket.off(SocketMessageTypes.contactOnline, onContactOnline);
            socket.off(SocketMessageTypes.contactOffline, onContactOffline);
        };
    }, [socket]);

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
