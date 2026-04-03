import React, { useContext } from "react";
import { MainChat } from "./main-chat/MainChat";
import { SendMessageBar } from "./send-message-bar/SendMessageBar";
import { TopBar } from "./top-bar/TopBar";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { ContactRequest } from "./contact-request/ContactRequest";
import { useMessageCache } from "../../shared/hooks/useMessageCache";

export function Chat() {
    const [selectedContact] = useContext(ContactsContext).selectedContact;

    useMessageCache();

    return selectedContact ? (
        <div className={"h-screen w-full overflow-y-scroll"}>
            <TopBar selectedContact={selectedContact} />
            {!selectedContact.isAccepted && (
                <ContactRequest selectedContact={selectedContact} />
            )}
            {selectedContact.isAccepted && <MainChat />}
            <SendMessageBar selectedContact={selectedContact} />
        </div>
    ) : (
        <div className={"w-full flex justify-center items-center"}>
            <h2 className={"text-2xl"}>Welcome to Florian's Chat!</h2>
        </div>
    );
}
