import { useEffect, useState } from "react";
import { MainChat } from "./main-chat/MainChat";
import { messageData } from "../../data/messages";
import { SendMessageBar } from "./send-message-bar/SendMessageBar";
import { TopBar } from "./top-bar/TopBar";
import { Contact } from "../../shared/types/Contact";

export function Chat(props: { selectedContact?: Contact }) {
    const [messages, setMessages] = useState(
        messageData[Object.keys(messageData)[0]],
    );

    useEffect(() => {
        setMessages(
            props.selectedContact
                ? messageData[props.selectedContact.name]
                : [],
        );
    }, [props.selectedContact]);

    return (
        <div className={"h-screen w-full overflow-y-scroll"}>
            <TopBar selectedContact={props.selectedContact} />
            <MainChat messages={messages} />#
            <SendMessageBar
                selectedContact={props.selectedContact}
                setMessages={setMessages}
            />
        </div>
    );
}
