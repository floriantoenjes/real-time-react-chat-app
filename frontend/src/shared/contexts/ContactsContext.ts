import { createContext, Dispatch, SetStateAction } from "react";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { ContactGroup } from "real-time-chat-backend/shared/contact-group.contract";

export const ContactsContext = createContext<{
    contacts: [Contact[], Dispatch<SetStateAction<Contact[]>>];
    contactsOnlineStatus: [
        Map<string, boolean>,
        Dispatch<SetStateAction<Map<string, boolean>>>,
    ];
    contactGroups: [ContactGroup[], Dispatch<SetStateAction<ContactGroup[]>>];
    selectedContact: [
        Contact | ContactGroup | undefined,
        Dispatch<SetStateAction<Contact | ContactGroup | undefined>>,
    ];
}>({
    contacts: [[], () => {}],
    contactsOnlineStatus: [new Map<string, boolean>(), () => {}],
    contactGroups: [[], () => {}],
    selectedContact: [undefined, () => {}],
});
