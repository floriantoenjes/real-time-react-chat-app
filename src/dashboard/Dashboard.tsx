import "./Dashboard.css";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { useState } from "react";
import { User } from "../shared/types/User";
import { Navigate } from "react-router-dom";
import { Contact } from "../shared/types/Contact";
import { contacts } from "../data/contacts";

export function Dashboard(props: { user?: User }) {
    const defaultContact = props.user
        ? contacts[props.user.username.toLowerCase()][0]
        : undefined;

    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
        defaultContact,
    );

    if (!props.user) {
        return <Navigate to={"/"} />;
    }

    return (
        <div className={"h-screen flex"}>
            <Sidebar
                username={props.user.username}
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
            />
            <Chat selectedContact={selectedContact} />
        </div>
    );
}
