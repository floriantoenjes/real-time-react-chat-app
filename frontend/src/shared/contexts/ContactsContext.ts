import { createContext, Dispatch, SetStateAction } from "react";
import { Contact } from "../types/Contact";
import { ContactService } from "../services/ContactService";

export const ContactsContext = createContext<{
    contacts: [Contact[], Dispatch<SetStateAction<Contact[]>>];
    selectedContact: [
        Contact | undefined,
        Dispatch<SetStateAction<Contact | undefined>>,
    ];
    contactService: ContactService;
}>({
    contacts: [[], () => {}],
    selectedContact: [undefined, () => {}],
    contactService: new ContactService(),
});
