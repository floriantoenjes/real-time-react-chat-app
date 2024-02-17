import { createContext, Dispatch, SetStateAction } from "react";
import { ContactService } from "../services/ContactService";
import { ContactGroupService } from "../services/ContactGroupService";
import { ContactGroup } from "real-time-chat-backend/dist/shared/contact-group.contract";
import { User } from "real-time-chat-backend/dist/shared/user.contract";

export const ContactsContext = createContext<{
    contacts: [User[], Dispatch<SetStateAction<User[]>>];
    contactGroups: [ContactGroup[], Dispatch<SetStateAction<ContactGroup[]>>];
    selectedContact: [
        User | undefined,
        Dispatch<SetStateAction<User | undefined>>,
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
