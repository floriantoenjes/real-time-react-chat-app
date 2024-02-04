import { createContext, Dispatch, SetStateAction } from "react";
import { ContactService } from "../services/ContactService";
import { Contact } from "../contract";

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
