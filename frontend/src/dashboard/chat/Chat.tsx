import { useContext, useEffect, useState } from "react";
import { MainChat } from "./main-chat/MainChat";
import { SendMessageBar } from "./send-message-bar/SendMessageBar";
import { TopBar } from "./top-bar/TopBar";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { SocketContext } from "../../shared/contexts/SocketContext";
import { Message } from "../../shared/types/Message";
import { useUserContext } from "../../shared/contexts/UserContext";
import { MessageContext } from "../../shared/contexts/MessageContext";

export function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [user] = useUserContext();
    const messageService = useContext(MessageContext);

    const [socket] = useContext(SocketContext);

    useEffect(() => {
        async function fetchMessages() {
            setMessages(await messageService.getMessages(user.username));
        }

        if (!selectedContact) {
            return;
        }

        void fetchMessages();
    }, [user.username, selectedContact]);

    useEffect(() => {
        function addMessage(message: string) {
            const newMessageData = [...messages];
            newMessageData.push({
                from: user.username,
                at: new Date(),
                message,
            });
            setMessages(newMessageData);
        }

        if (socket) {
            socket?.once("message", addMessage);
        }
    }, [socket, messages, user.username]);

    return selectedContact ? (
        <div className={"h-screen w-full overflow-y-scroll"}>
            <TopBar setMessages={setMessages} />
            <MainChat messages={messages} />#
            <SendMessageBar />
        </div>
    ) : (
        <div></div>
    );
}
