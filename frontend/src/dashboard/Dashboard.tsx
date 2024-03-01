import "./Dashboard.css";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { ContactsContext } from "../shared/contexts/ContactsContext";
import { MessageContext } from "../shared/contexts/MessageContext";
import { User } from "real-time-chat-backend/shared/user.contract";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { Message } from "real-time-chat-backend/shared/message.contract";
import { ContactGroup } from "real-time-chat-backend/shared/contact-group.contract";
import { useDiContext } from "../shared/contexts/DiContext";

export function Dashboard(props: { user?: User }) {
    if (!props.user) {
        return <Navigate to={"/"} />;
    }

    const contactService = useRef(useDiContext().ContactService);
    const contactGroupService = useRef(useDiContext().ContactGroupService);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
        undefined,
    );

    const [messages, setMessages] = useState<Message[]>([]);

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

            setContactGroups(
                await contactGroupService.current.getContactGroups(
                    props.user._id.toString(),
                ),
            );
        })();
    }, [props.user, contactService]);

    return (
        <div className={"h-screen flex"}>
            <ContactsContext.Provider
                value={{
                    contacts: [contacts, setContacts],
                    contactGroups: [contactGroups, setContactGroups],
                    selectedContact: [selectedContact, setSelectedContact],
                }}
            >
                <MessageContext.Provider value={[messages, setMessages]}>
                    <Sidebar />
                    <Chat />
                </MessageContext.Provider>
            </ContactsContext.Provider>
        </div>
    );
}
