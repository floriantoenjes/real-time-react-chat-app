import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useEffectEvent,
    useRef,
    useState,
} from "react";
import { Message, MessageSchema } from "@t/message.contract";
import { SocketContext } from "./SocketContext";
import { SocketMessageTypes } from "@t/socket-message-types.enum";
import { useDiContext } from "./DiContext";
import { ContactsContext } from "./ContactsContext";
import { useUserContext } from "./UserContext";
import { MessageAddons } from "../enums/message";

export const MessageContext = createContext<
    [Message[], Dispatch<SetStateAction<Message[]>>]
>([[], () => {}]);

export function MessageProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [socket] = useContext(SocketContext);
    const [user] = useUserContext();
    const [contactGroups] = useContext(ContactsContext).contactGroups;
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const messageService = useDiContext().MessageService;
    const messagesCache = useRef<Map<string, Message[]>>(new Map());

    const addMessage = useEffectEvent((message: Message) => {
        message = MessageSchema.parse(message);

        // Determine which contact this message belongs to
        const isGroupMessage = contactGroups.some(
            (group) => group._id === message.toUserId,
        );

        const contactId = isGroupMessage
            ? message.toUserId // Group message: use the group ID
            : message.fromUserId === user._id
              ? message.toUserId // I sent it: use recipient ID
              : message.fromUserId; // Someone sent to me: use sender ID

        // Always update cache
        const cached = messagesCache.current.get(contactId) ?? [];
        messagesCache.current.set(contactId, [...cached, message]);

        // Update display if viewing that contact
        if (selectedContact?._id === contactId) {
            setMessages((prev) => [...prev, message]);
            messageService.setMessageRead(message._id);
        }
    });

    const handleMessageRead = useEffectEvent((msgId: string) => {
        setMessages((prevState) => {
            const nowReadMsgIdx = prevState.findIndex((msg) => {
                return (
                    msg._id === msgId ||
                    msg._id.startsWith(MessageAddons.TEMP_PREFIX)
                );
            });
            if (!prevState[nowReadMsgIdx]) {
                return prevState;
            }
            prevState[nowReadMsgIdx] = {
                ...prevState[nowReadMsgIdx],
                read: true,
            };
            return [...prevState];
        });
    });

    useEffect(() => {
        if (!socket) {
            return;
        }

        socket.on(SocketMessageTypes.message, addMessage);
        socket.on(SocketMessageTypes.messageRead, handleMessageRead);

        return () => {
            socket.off(SocketMessageTypes.message, addMessage);
            socket.off(SocketMessageTypes.messageRead, handleMessageRead);
        };
    }, [socket, addMessage, handleMessageRead, selectedContact?._id]);

    return (
        <MessageContext.Provider value={[messages, setMessages]}>
            {children}
        </MessageContext.Provider>
    );
}
