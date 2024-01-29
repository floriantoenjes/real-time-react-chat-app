import { createContext, Dispatch, SetStateAction } from "react";
import { Contact } from "../types/Contact";

export const ContactsContext = createContext<{
    contacts: [Contact[], Dispatch<SetStateAction<Contact[]>>];
    selectedContact: [
        Contact | undefined,
        Dispatch<SetStateAction<Contact | undefined>>,
    ];
}>({
    contacts: [[], () => {}],
    selectedContact: [undefined, () => {}],
});
