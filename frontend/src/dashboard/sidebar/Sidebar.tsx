import { useContext, useEffect, useState } from "react";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { useUserContext } from "../../shared/contexts/UserContext";
import { TopSection } from "./top-section/TopSection";
import { SocketContext } from "../../shared/contexts/SocketContext";
import { Message } from "@t/message.contract";
import { SocketMessageTypes } from "@t/socket-message-types.enum";
import { ContactSearch } from "./contact-search/ContactSearch";
import { ContactList } from "./contact-list/ContactList";

export function Sidebar() {
    const [user] = useUserContext();
    const contactsContext = useContext(ContactsContext);

    const [selectedContact] = contactsContext.selectedContact;
    const [userContacts, setUserContacts] = contactsContext.contacts;
    const [contactGroups, setContactGroups] = contactsContext.contactGroups;

    const [socket] = useContext(SocketContext);
    const [lastMessage, setLastMessage] = useState<Message>();

    const [nameFilter, setNameFilter] = useState<string | undefined>();

    useEffect(() => {
        function updateLastMessage(message: Message) {
            // Check if the message belongs to a contact group
            const contactGroupWithNewMessage = contactGroups.find(
                (cg) => cg._id === message.toUserId,
            );
            if (contactGroupWithNewMessage) {
                contactGroupWithNewMessage.lastMessage = message._id;
                setContactGroups([...contactGroups]);
                setLastMessage(message);
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
            setLastMessage(message);
        }

        if (socket) {
            socket.once(SocketMessageTypes.message, updateLastMessage);
        }

        return () => {
            socket?.off(SocketMessageTypes.message);
        };
    }, [socket, user.username, lastMessage, userContacts, contactGroups]);

    return (
        <div
            className={
                "sidebar h-screen border bg-white" +
                (selectedContact ? " hidden md:block" : "")
            }
        >
            <TopSection />
            <ContactSearch onFilterChange={setNameFilter} />
            <div className={"border"}>
                <ContactList nameFilter={nameFilter} />
            </div>
        </div>
    );
}
