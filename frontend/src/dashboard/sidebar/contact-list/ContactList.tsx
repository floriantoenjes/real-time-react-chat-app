import { useContext } from "react";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useOnlineStatus } from "../../../shared/contexts/OnlineStatusContext";
import { Contact } from "../../../shared/Contact";

type UserContact = {
    _id: string;
    name: string;
    memberIds?: string[];
    lastMessage?: string | undefined;
    avatarFileName?: string | undefined;
    avatarBase64?: any;
};

export function ContactList(props: { nameFilter?: string }) {
    const contactsContext = useContext(ContactsContext);
    const [selectedContact, setSelectedContact] =
        contactsContext.selectedContact;
    const [userContacts] = contactsContext.contacts;
    const [userContactGroups] = contactsContext.contactGroups;
    const { contactsOnlineStatus } = useOnlineStatus();

    function sortByLastMessageDateTime(
        userContact1: UserContact,
        userContact2: UserContact,
    ) {
        const uc1MessageDate = userContact1.lastMessage?.at;
        const uc2MessageDate = userContact2.lastMessage?.at;

        if (uc1MessageDate && uc2MessageDate) {
            return -uc1MessageDate
                .toString()
                .localeCompare(uc2MessageDate.toString());
        }

        return 0;
    }

    const contacts = userContacts
        .concat(userContactGroups)
        .filter((contact) =>
            props.nameFilter !== undefined
                ? contact.name
                      .toLowerCase()
                      .match(props.nameFilter.toLowerCase())
                : true,
        )
        .sort((uc1, uc2) => sortByLastMessageDateTime(uc1, uc2))
        .map((c) => {
            return (
                <Contact
                    key={c.name}
                    contact={c}
                    selectedContact={selectedContact}
                    onContactSelect={() => setSelectedContact(c)}
                    isOnline={contactsOnlineStatus.get(c._id)}
                />
            );
        });

    return <div className={"border"}>{contacts}</div>;
}
