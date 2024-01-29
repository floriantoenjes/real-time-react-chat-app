import "./Dashboard.css";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { useState } from "react";
import { User } from "../shared/types/User";
import { Navigate } from "react-router-dom";
import { Contact } from "../shared/types/Contact";
import { contactsData } from "../data/contacts";
import { ContactsContext } from "../shared/contexts/ContactsContext";

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
            <ContactsContext.Provider value={[contacts, setContacts]}>
                <Sidebar
                    username={props.user.username}
                    selectedContact={selectedContact}
                    setSelectedContact={setSelectedContact}
                />
                <Chat selectedContact={selectedContact} />
            </ContactsContext.Provider>
        </div>
    );
}
