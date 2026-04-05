import {
    createContext,
    Dispatch,
    ReactNode,
    RefObject,
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

export const MessageContext = createContext<{
    messages: [Message[], Dispatch<SetStateAction<Message[]>>];
    messageCache: RefObject<Map<string, Message[]>> | undefined;
}>({ messages: [[], () => {}], messageCache: undefined });

export function useMessageContext(): {
    messages: [Message[], Dispatch<SetStateAction<Message[]>>];
    messageCache: RefObject<Map<string, Message[]>>;
} {
    const { messages, messageCache } = useContext(MessageContext);
    if (!messageCache) {
        throw new Error("messageCache must be defined to use MessageContext!");
    }
    return { messages, messageCache };
}

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

        const isGroupMessage = contactGroups.some(
            (group) => group._id === message.toUserId,
        );

        const contactId = isGroupMessage
            ? message.toUserId // Group message: use the group ID
            : message.fromUserId === user._id
              ? message.toUserId // I sent it: use recipient ID
              : message.fromUserId; // Someone sent to me: use sender ID

        // Update display if viewing that contact
        if (selectedContact?._id === contactId) {
            setMessages((prev) => [...prev, message]);
            messageService.setMessageRead(message._id);
        } else {
            messagesCache.current.get(contactId)?.push(message);
        }
    });

    const handleMessageRead = useEffectEvent((msgId: string) => {
        setMessages((prevState) => {
            const nowReadMsgIdx = prevState.findIndex((msg) => {
                return (
                    msg._id === msgId ||
                    msg._id.startsWith(MessageAddons.TEMP_PREFIX) // TODO: might be too unprecise at times
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
        <MessageContext.Provider
            value={{
                messages: [messages, setMessages],
                messageCache: messagesCache,
            }}
        >
            {children}
        </MessageContext.Provider>
    );
}
