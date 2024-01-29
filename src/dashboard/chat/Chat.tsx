import { useContext, useEffect, useState } from "react";
import { MainChat } from "./main-chat/MainChat";
import { messageData } from "../../data/messages";
import { SendMessageBar } from "./send-message-bar/SendMessageBar";
import { TopBar } from "./top-bar/TopBar";
import { ContactsContext } from "../../shared/contexts/ContactsContext";

export function Chat() {
    const [messages, setMessages] = useState(
        messageData[Object.keys(messageData)[0]],
    );

    const [selectedContact] = useContext(ContactsContext).selectedContact;

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

    return selectedContact ? (
        <div className={"h-screen w-full overflow-y-scroll"}>
            <TopBar setMessages={setMessages} />
            <MainChat messages={messages} />#
            <SendMessageBar messages={messages} setMessages={setMessages} />
        </div>
    ) : (
        <div></div>
    );
}
