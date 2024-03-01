import { createContext, Dispatch, SetStateAction } from "react";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { ContactGroup } from "real-time-chat-backend/shared/contact-group.contract";

export const ContactsContext = createContext<{
    contacts: [Contact[], Dispatch<SetStateAction<Contact[]>>];
    contactGroups: [ContactGroup[], Dispatch<SetStateAction<ContactGroup[]>>];
    selectedContact: [
        Contact | ContactGroup | undefined,
        Dispatch<SetStateAction<Contact | ContactGroup | undefined>>,
    ];
}>({
    contacts: [[], () => {}],
    contactGroups: [[], () => {}],
    selectedContact: [undefined, () => {}],
});
