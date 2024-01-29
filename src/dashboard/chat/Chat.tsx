import { useContext, useEffect, useState } from "react";
import { MainChat } from "./main-chat/MainChat";
import { messageData } from "../../data/messages";
import { SendMessageBar } from "./send-message-bar/SendMessageBar";
import { TopBar } from "./top-bar/TopBar";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { SocketContext } from "../../shared/contexts/SocketContext";

export function Chat() {
    const [messages, setMessages] = useState(
        messageData[Object.keys(messageData)[0]],
    );

    const [selectedContact] = useContext(ContactsContext).selectedContact;

    const [socket] = useContext(SocketContext);

    useEffect(() => {
        if (!selectedContact) {
            setMessages([]);
            return;
        }

        if (!messageData[selectedContact.name]) {
            setMessages([]);
            return;
        }

        setMessages(messageData[selectedContact.name]);
    }, [selectedContact]);

    let counter = 0;

    useEffect(() => {
        if (socket) {
            socket?.on("message", addMessage);
        }
    }, [socket, messages]);

    function addMessage(message: string) {
        const newMessageData = [...messages];
        newMessageData.push({
            from: "florian",
            at: new Date(),
            message,
        });
        setMessages(newMessageData);
    }

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
