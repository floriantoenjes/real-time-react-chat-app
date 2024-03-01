import { useContext, useEffect } from "react";
import { MainChat } from "./main-chat/MainChat";
import { SendMessageBar } from "./send-message-bar/SendMessageBar";
import { TopBar } from "./top-bar/TopBar";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { SocketContext } from "../../shared/contexts/SocketContext";
import { useUserContext } from "../../shared/contexts/UserContext";
import { MessageContext } from "../../shared/contexts/MessageContext";
import { Message } from "real-time-chat-backend/shared/message.contract";
import { useDiContext } from "../../shared/contexts/DiContext";

export function Chat() {
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [user] = useUserContext();
    const [messages, setMessages] = useContext(MessageContext);
    const [socket] = useContext(SocketContext);
    const messageService = useDiContext().MessageService;

    useEffect(() => {
        async function fetchMessages() {
            if (!selectedContact) {
                return;
            }

            setMessages(
                await messageService.getMessages(user._id, selectedContact._id),
            );
        }
        void fetchMessages();
    }, [user, selectedContact, setMessages, messageService]);

    useEffect(() => {
        function addMessage(message: Message) {
            const newMessageData = [...(messages ?? [])];
            newMessageData.push(message);
            setMessages(newMessageData);
        }

        if (socket) {
            socket?.once("message", addMessage);
        }
    }, [socket, messages, user.username, setMessages]);

    return selectedContact ? (
        <div className={"h-screen w-full overflow-y-scroll"}>
            <TopBar />
            <MainChat />
            <SendMessageBar />
        </div>
    ) : (
        <div></div>
    );
}
