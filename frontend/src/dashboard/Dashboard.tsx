import "./Dashboard.css";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { ContactsContext } from "../shared/contexts/ContactsContext";
import { MessageService } from "../shared/services/MessageService";
import { ContactService } from "../shared/services/ContactService";
import { MessageContext } from "../shared/contexts/MessageContext";
import {
    Contact,
    Message,
    User,
} from "real-time-chat-backend/dist/shared/contract";

export function Dashboard(props: { user?: User }) {
    const contactService = useRef(new ContactService());
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
        undefined,
    );

    const [messages, setMessages] = useState<Message[]>([]);
    const messageService = useRef(new MessageService());

    useEffect(() => {
        (async () => {
            if (!props.user?._id) {
                return;
            }

            setContacts(
                await contactService.current.getContacts(
                    props.user._id.toString(),
                ),
            );
        })();
    }, [props.user, contactService]);

    if (!props.user) {
        return <Navigate to={"/"} />;
    }

    return (
        <div className={"h-screen flex"}>
            <ContactsContext.Provider
                value={{
                    contacts: [contacts, setContacts],
                    selectedContact: [selectedContact, setSelectedContact],
                    contactService: contactService.current,
                }}
            >
                <MessageContext.Provider
                    value={[messages, setMessages, messageService.current]}
                >
                    <Sidebar />
                    <Chat />
                </MessageContext.Provider>
            </ContactsContext.Provider>
        </div>
    );
}
