import { useContext } from "react";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useOnlineStatus } from "../../../shared/contexts/OnlineStatusContext";
import { Contact } from "../../../shared/Contact";
import { Message } from "@t/message.contract";
import { useLastContactMessageCache } from "../../../shared/hooks/useLastContactMessageCache";

export function ContactList(props: { nameFilter?: string }) {
    const contactsContext = useContext(ContactsContext);
    const [selectedContact, setSelectedContact] =
        contactsContext.selectedContact;
    const [userContacts] = contactsContext.contacts;
    const [userContactGroups] = contactsContext.contactGroups;
    const { contactsOnlineStatus } = useOnlineStatus();

    const { loaded, lastMessageCache } = useLastContactMessageCache();

    function sortByLastMessageDateTime(
        uc1Message?: Message,
        uc2Message?: Message,
    ) {
        if (uc1Message && uc2Message) {
            return -uc1Message.at
                .toString()
                .localeCompare(uc2Message.at.toString());
        }

        return 0;
    }

    const contactElements = userContacts
        .concat(userContactGroups)
        .filter((contact) =>
            props.nameFilter !== undefined
                ? contact.name
                      .toLowerCase()
                      .match(props.nameFilter.toLowerCase())
                : true,
        )
        .sort((uc1, uc2) => {
            const uc1LastMessage = uc1.lastMessage;
            const uc2LastMessage = uc2.lastMessage;

            if (!uc1LastMessage || !uc2LastMessage) {
                if (!uc1LastMessage) {
                    return 1;
                }
                if (!uc2LastMessage) {
                    return -1;
                }
            }

            return sortByLastMessageDateTime(
                lastMessageCache.get(uc1LastMessage),
                lastMessageCache.get(uc2LastMessage),
            );
        })
        .map((contact) => {
            return (
                <Contact
                    key={contact._id}
                    contact={contact}
                    selectedContact={selectedContact}
                    onContactSelect={() => setSelectedContact(contact)}
                    isOnline={contactsOnlineStatus.get(contact._id)}
                    lastMessage={
                        contact.lastMessage
                            ? lastMessageCache.get(contact.lastMessage)
                            : undefined
                    }
                />
            );
        });

    return <div>{loaded && contactElements}</div>;
}
