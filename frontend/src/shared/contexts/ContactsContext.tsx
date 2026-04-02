import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from "react";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { ContactGroup } from "real-time-chat-backend/shared/contact-group.contract";
import { useDiContext } from "./DiContext";
import { SocketContext } from "./SocketContext";
import { SocketMessageTypes } from "@t/socket-message-types.enum";
import { UserContext } from "./UserContext";

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

export function ContactsProvider({ children }: { children: ReactNode }) {
    const {
        ContactService: contactService,
        ContactGroupService: contactGroupService,
    } = useDiContext();

    const [socket] = useContext(SocketContext);
    const [user] = useContext(UserContext);

    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
        undefined,
    );
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);

    useEffect(() => {
        (async () => {
            if (!user?._id) {
                return;
            }
            setContacts(await contactService.getContacts());
            setContactGroups(await contactGroupService.getContactGroups());
        })();
    }, [user?._id]);

    useEffect(() => {
        if (!socket) {
            return;
        }

        const handleContactAutoAdded = (newContact: Contact) => {
            setContacts((prevContacts) => {
                const exists = prevContacts.some(
                    (c) => c._id === newContact._id,
                );
                if (exists) {
                    return prevContacts;
                }
                return [...prevContacts, newContact];
            });
        };

        socket.on(SocketMessageTypes.contactAutoAdded, handleContactAutoAdded);

        return () => {
            socket.off(
                SocketMessageTypes.contactAutoAdded,
                handleContactAutoAdded,
            );
        };
    }, [socket, setContacts]);

    return (
        <ContactsContext.Provider
            value={{
                contacts: [contacts, setContacts],
                contactGroups: [contactGroups, setContactGroups],
                selectedContact: [selectedContact, setSelectedContact],
            }}
        >
            {children}
        </ContactsContext.Provider>
    );
}
