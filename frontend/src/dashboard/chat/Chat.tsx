import { useContext, useEffect, useState } from "react";
import { MainChat } from "./main-chat/MainChat";
import { SendMessageBar } from "./send-message-bar/SendMessageBar";
import { TopBar } from "./top-bar/TopBar";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { SocketContext } from "../../shared/contexts/SocketContext";
import { Message } from "../../shared/types/Message";
import axios from "axios";
import { UserContext } from "../../shared/contexts/UserContext";
import { BACKEND_URL } from "../../environment";

export function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);

    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [user] = useContext(UserContext);

    const [socket] = useContext(SocketContext);

    useEffect(() => {
        async function fetchMessages() {
            const response = await axios.post<Message[]>(
                `${BACKEND_URL}/get-messages`,
                {
                    username: user?.username.toLowerCase(),
                },
            );
            setMessages(response.data);
        }

        if (!selectedContact) {
            return;
        }

        void fetchMessages();
    }, [user?.username, selectedContact]);

    useEffect(() => {
        function addMessage(message: string) {
            if (!user) {
                return;
            }

            const newMessageData = [...messages];
            newMessageData.push({
                from: user.username.toLowerCase(),
                at: new Date(),
                message,
            });
            setMessages(newMessageData);
        }

        if (socket) {
            socket?.on("message", addMessage);
        }
    }, [socket, messages, user?.username]);

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
