import "./Dashboard.css";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { User } from "real-time-chat-backend/shared/user.contract";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { Message } from "real-time-chat-backend/shared/message.contract";
import { ContactGroup } from "real-time-chat-backend/shared/contact-group.contract";
import { useDiContext } from "../shared/contexts/DiContext";
import { SocketContext } from "../shared/contexts/SocketContext";
import { RoutesEnum } from "../shared/enums/routes";
import { MessageContext } from "../shared/contexts/MessageContext";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { ContactsContext } from "../shared/contexts/ContactsContext";
import { PeerProvider } from "../shared/contexts/PeerContext";
import { SocketMessageTypes } from "@t/socket-message-types.enum";

export function Dashboard(props: { user?: User }) {
    const isLoggedIn = props.user;
    if (!isLoggedIn) {
        return <Navigate to={RoutesEnum.LOGIN} />;
    }

    const [contactsOnlineStatus, setContactsOnlineStatus] = useState<
        Map<string, boolean>
    >(new Map<string, boolean>());

    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
        undefined,
    );

    const contactService = useRef(useDiContext().ContactService);
    const contactGroupService = useRef(useDiContext().ContactGroupService);

    const [contacts, setContacts] = useState<Contact[]>([]);

    const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [socket] = useContext(SocketContext);

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

    useEffect(() => {
        if (!contacts) {
            return;
        }
        (async () => {
            await getContactsOnlineStatus();
        })();
    }, [contacts]);

    useEffect(() => {
        listenOnContactOnlineStatusChanges();
    }, [socket]);

    function listenOnContactOnlineStatusChanges() {
        function setContactOnlineStatusOnOrOffline(
            contactId: string,
            onlineStatus: boolean,
        ) {
            setContactsOnlineStatus((prevState) => {
                prevState.set(contactId, onlineStatus);
                return new Map(prevState);
            });
        }

        if (socket) {
            socket.on(SocketMessageTypes.contactOnline, (contactId: string) => {
                setContactOnlineStatusOnOrOffline(contactId, true);
            });

            socket.on(
                SocketMessageTypes.contactOffline,
                (contactId: string) => {
                    setContactOnlineStatusOnOrOffline(contactId, false);
                },
            );
        }
    }

    async function getContactsOnlineStatus() {
        const res = await contactService.current.getContactsOnlineStatus(
            contacts.map((c) => c._id),
        );
        if (res.status === 200) {
            const onlineStatusMap = new Map<string, boolean>();
            for (const userId of Object.keys(res.body)) {
                onlineStatusMap.set(userId, res.body[userId]);
            }
            setContactsOnlineStatus(onlineStatusMap);
        }
    }

    return (
        <div className={"h-screen flex bg-gray-100"}>
            <ContactsContext.Provider
                value={{
                    contacts: [contacts, setContacts],
                    contactsOnlineStatus: [
                        contactsOnlineStatus,
                        setContactsOnlineStatus,
                    ],
                    contactGroups: [contactGroups, setContactGroups],
                    selectedContact: [selectedContact, setSelectedContact],
                }}
            >
                <>
                    <MessageContext.Provider value={[messages, setMessages]}>
                        <PeerProvider>
                            <Sidebar />
                            <Chat />
                        </PeerProvider>
                    </MessageContext.Provider>
                </>
            </ContactsContext.Provider>
        </div>
    );
}
