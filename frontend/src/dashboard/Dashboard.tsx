import "./Dashboard.css";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { useEffect, useState } from "react";
import { User } from "../shared/types/User";
import { Navigate } from "react-router-dom";
import { Contact } from "../shared/types/Contact";
import { ContactsContext } from "../shared/contexts/ContactsContext";
import { MessageService } from "../shared/services/MessageService";
import { ContactService } from "../shared/services/ContactService";
import { MessageContext } from "../shared/contexts/MessageContext";
import { Message } from "../shared/types/Message";

export function Dashboard(props: { user?: User }) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
        undefined,
    );
    const contactService = new ContactService();
    const [messages, setMessages] = useState<Message[] | undefined>([]);

    useEffect(() => {
        (async () => {
            if (!props.user) {
                return;
            }

            setContacts(
                await contactService.getContacts(props.user._id.toString()),
            );
        })();
    }, [props.user]);

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
