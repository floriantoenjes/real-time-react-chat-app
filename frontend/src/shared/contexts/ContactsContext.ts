import { createContext, Dispatch, SetStateAction } from "react";
import { ContactService } from "../services/ContactService";
import { Contact } from "real-time-chat-backend/dist/shared/contact.contract";
import { ContactGroupService } from "../services/ContactGroupService";
import { ContactGroup } from "real-time-chat-backend/dist/shared/contact-group.contract";

export const ContactsContext = createContext<{
    contacts: [Contact[], Dispatch<SetStateAction<Contact[]>>];
    contactGroups: [ContactGroup[], Dispatch<SetStateAction<ContactGroup[]>>];
    selectedContact: [
        Contact | ContactGroup | undefined,
        Dispatch<SetStateAction<Contact | ContactGroup | undefined>>,
    ];
    contactService: ContactService;
    contactGroupService: ContactGroupService;
}>({
    contacts: [[], () => {}],
    contactGroups: [[], () => {}],
    selectedContact: [undefined, () => {}],
    contactService: new ContactService(),
    contactGroupService: new ContactGroupService(),
});
