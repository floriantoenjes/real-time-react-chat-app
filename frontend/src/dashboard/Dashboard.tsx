import "./Dashboard.css";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { useEffect, useMemo, useState } from "react";
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
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
        undefined,
    );
    const contactService = useMemo<ContactService>(
        () => new ContactService(),
        [],
    );
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        (async () => {
            if (!props.user?._id) {
                return;
            }

            setContacts(
                await contactService.getContacts(props.user._id.toString()),
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
                    contactService,
                }}
            >
                <MessageContext.Provider
                    value={[messages, setMessages, new MessageService()]}
                >
                    <Sidebar />
                    <Chat />
                </MessageContext.Provider>
            </ContactsContext.Provider>
        </div>
    );
}
