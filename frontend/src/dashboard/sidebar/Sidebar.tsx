import { useContext, useEffect, useEffectEvent, useState } from "react";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { TopSection } from "./top-section/TopSection";
import { SocketContext } from "../../shared/contexts/SocketContext";
import { Message } from "@t/message.contract";
import { SocketMessageTypes } from "@t/socket-message-types.enum";
import { ContactSearch } from "./contact-search/ContactSearch";
import { ContactList } from "./contact-list/ContactList";

export function Sidebar() {
    const contactsContext = useContext(ContactsContext);

    const [selectedContact] = contactsContext.selectedContact;
    const [userContacts, setUserContacts] = contactsContext.contacts;
    const [contactGroups, setContactGroups] = contactsContext.contactGroups;

    const [socket] = useContext(SocketContext);

    const [nameFilter, setNameFilter] = useState<string | undefined>();

    const onMessage = useEffectEvent((message: Message) => {
        // Check if the message belongs to a contact group
        const contactGroupWithNewMessage = contactGroups.find(
            (cg) => cg._id === message.toUserId,
        );
        if (contactGroupWithNewMessage) {
            contactGroupWithNewMessage.lastMessage = message._id;
            setContactGroups([...contactGroups]);
            return;
        }

        // Otherwise, it's a direct contact message
        const userContactWithNewMessage = userContacts.find(
            (uc) => uc._id === message.fromUserId,
        );
        if (userContactWithNewMessage) {
            userContactWithNewMessage.lastMessage = message._id;
            setUserContacts([...userContacts]);
        }
    });

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.on(SocketMessageTypes.message, onMessage);
        return () => {
            socket.off(SocketMessageTypes.message, onMessage);
        };
    }, [socket]);

    return (
        <div
            className={
                "sidebar h-screen bg-white" +
                (selectedContact ? " hidden md:block" : "")
            }
        >
            <TopSection />
            <ContactSearch onFilterChange={setNameFilter} />
            <div>
                <ContactList nameFilter={nameFilter} />
            </div>
        </div>
    );
}
