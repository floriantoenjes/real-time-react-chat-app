import "./Dashboard.css";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { useState } from "react";
import { User } from "../shared/types/User";
import { Navigate } from "react-router-dom";
import { Contact } from "../shared/types/Contact";
import { contactsData } from "../data/contacts";
import { ContactsContext } from "../shared/contexts/ContactsContext";
import { MessageContext } from "../shared/contexts/MessageContext";
import { MessageService } from "../shared/services/MessageService";

export function Dashboard(props: { user?: User }) {
    const [contacts, setContacts] = useState(
        props.user ? contactsData[props.user.username.toLowerCase()] : [],
    );

    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
        props.user ? contacts[0] : undefined,
    );

    if (!props.user) {
        return <Navigate to={"/"} />;
    }

    return (
        <div className={"h-screen flex"}>
            <ContactsContext.Provider
                value={{
                    contacts: [contacts, setContacts],
                    selectedContact: [selectedContact, setSelectedContact],
                }}
            >
                <MessageContext.Provider value={new MessageService()}>
                    <Sidebar />
                    <Chat />
                </MessageContext.Provider>
            </ContactsContext.Provider>
        </div>
    );
}
