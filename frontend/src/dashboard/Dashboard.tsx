import "./Dashboard.css";
import React, { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { User } from "real-time-chat-backend/shared/user.contract";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { Message } from "real-time-chat-backend/shared/message.contract";
import { ContactGroup } from "real-time-chat-backend/shared/contact-group.contract";
import { useDiContext } from "../shared/contexts/DiContext";
import { RoutesEnum } from "../shared/enums/routes";
import { MessageContext } from "../shared/contexts/MessageContext";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { ContactsContext } from "../shared/contexts/ContactsContext";
import { PeerProvider } from "../shared/contexts/PeerContext";
import { OnlineStatusProvider } from "../shared/contexts/OnlineStatusContext";

export function Dashboard(props: { user?: User }) {
    const isLoggedIn = props.user;
    if (!isLoggedIn) {
        return <Navigate to={RoutesEnum.LOGIN} />;
    }

    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
        undefined,
    );

    const contactService = useRef(useDiContext().ContactService);
    const contactGroupService = useRef(useDiContext().ContactGroupService);

    const [contacts, setContacts] = useState<Contact[]>([]);

    const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);

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
        <div className={"h-screen flex bg-gray-100"}>
            <ContactsContext.Provider
                value={{
                    contacts: [contacts, setContacts],
                    contactGroups: [contactGroups, setContactGroups],
                    selectedContact: [selectedContact, setSelectedContact],
                }}
            >
                <OnlineStatusProvider
                    contactIds={contacts.map((c) => c._id)}
                >
                    <MessageContext.Provider value={[messages, setMessages]}>
                        <PeerProvider>
                            <Sidebar />
                            <Chat />
                        </PeerProvider>
                    </MessageContext.Provider>
                </OnlineStatusProvider>
            </ContactsContext.Provider>
        </div>
    );
}
