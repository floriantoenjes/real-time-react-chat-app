import { useContext, useEffect } from "react";
import { MainChat } from "./main-chat/MainChat";
import { SendMessageBar } from "./send-message-bar/SendMessageBar";
import { TopBar } from "./top-bar/TopBar";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { SocketContext } from "../../shared/contexts/SocketContext";
import { useUserContext } from "../../shared/contexts/UserContext";
import { MessageContext } from "../../shared/contexts/MessageContext";

export function Chat() {
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [user] = useUserContext();
    const [messages, setMessages, messageService] = useContext(MessageContext);
    const [socket] = useContext(SocketContext);

    useEffect(() => {
        async function fetchMessages() {
            if (!selectedContact) {
                return;
            }

            setMessages(
                await messageService.getMessages(
                    user._id,
                    selectedContact.userId,
                ),
            );
        }
        void fetchMessages();
    }, [user.username, selectedContact]);

    useEffect(() => {
        function addMessage(message: string) {
            const newMessageData = [...(messages ?? [])];
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
            <TopBar />
            <MainChat />
            <SendMessageBar />
        </div>
    ) : (
        <div></div>
    );
}
