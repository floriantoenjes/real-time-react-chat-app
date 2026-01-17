import { useContext, useEffect, useState } from "react";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { useUserContext } from "../../shared/contexts/UserContext";
import { TopSection } from "./top-section/TopSection";
import { useDiContext } from "../../shared/contexts/DiContext";
import { SocketContext } from "../../shared/contexts/SocketContext";
import { Message } from "@t/message.contract";
import { SocketMessageTypes } from "@t/socket-message-types.enum";
import { ContactSearch } from "./contact-search/ContactSearch";
import { ContactList } from "./contact-list/ContactList";

export function Sidebar() {
    const [user] = useUserContext();
    const { ContactService: contactService } = useDiContext();
    const contactsContext = useContext(ContactsContext);

    const [selectedContact] = contactsContext.selectedContact;
    const [userContacts, setUserContacts] = contactsContext.contacts;

    const [socket] = useContext(SocketContext);
    const [lastMessage, setLastMessage] = useState<Message>();

    const [nameFilter, setNameFilter] = useState<string | undefined>();

    useEffect(() => {
        function updateLastMessage(message: Message) {
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
    }, [socket, user.username, lastMessage, userContacts]);

    useEffect(() => {
        contactService
            .getContacts()
            .then((contacts) => setUserContacts(contacts));
    }, [user]);

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
