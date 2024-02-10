import "./Dashboard.css";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { ContactsContext } from "../shared/contexts/ContactsContext";
import { MessageService } from "../shared/services/MessageService";
import { ContactService } from "../shared/services/ContactService";
import { MessageContext } from "../shared/contexts/MessageContext";
import { User } from "real-time-chat-backend/dist/shared/user.contract";
import { Contact } from "real-time-chat-backend/dist/shared/contact.contract";
import { Message } from "real-time-chat-backend/dist/shared/message.contract";
import { ContactGroupService } from "../shared/services/ContactGroupService";
import { ContactGroup } from "real-time-chat-backend/dist/shared/contact-group.contract";

export function Dashboard(props: { user?: User }) {
    const contactService = useRef(new ContactService());
    const contactGroupService = useRef(new ContactGroupService());
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
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

            setContactGroups(
                await contactGroupService.current.getContactGroups(
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
                    contactGroups: [contactGroups, setContactGroups],
                    selectedContact: [selectedContact, setSelectedContact],
                    contactService: contactService.current,
                    contactGroupService: contactGroupService.current,
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
