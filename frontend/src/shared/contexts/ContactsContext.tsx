import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useEffectEvent,
    useState,
} from "react";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { ContactGroup } from "real-time-chat-backend/shared/contact-group.contract";
import { Message } from "@t/message.contract";
import { useDiContext } from "./DiContext";
import { SocketContext } from "./SocketContext";
import { SocketMessageTypes } from "@t/socket-message-types.enum";
import { UserContext } from "./UserContext";
import { ContactProfileUpdate } from "@t/user.contract";

export const ContactsContext = createContext<{
    contacts: [Contact[], Dispatch<SetStateAction<Contact[]>>];
    contactGroups: [ContactGroup[], Dispatch<SetStateAction<ContactGroup[]>>];
    leftGroups: [ContactGroup[], Dispatch<SetStateAction<ContactGroup[]>>];
    selectedContact: [
        Contact | ContactGroup | undefined,
        Dispatch<SetStateAction<Contact | ContactGroup | undefined>>,
    ];
    rejoinGroup: (groupId: string) => Promise<boolean>;
    leaveGroup: (groupId: string) => Promise<boolean>;
}>({
    contacts: [[], () => {}],
    contactGroups: [[], () => {}],
    leftGroups: [[], () => {}],
    selectedContact: [undefined, () => {}],
    rejoinGroup: async () => false,
    leaveGroup: async () => false,
});

export function ContactsProvider({ children }: { children: ReactNode }) {
    const {
        ContactService: contactService,
        ContactGroupService: contactGroupService,
        UserService: userService,
    } = useDiContext();

    const [socket] = useContext(SocketContext);
    const [user, setUser] = useContext(UserContext);

    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
        undefined,
    );
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
    const [leftGroups, setLeftGroups] = useState<ContactGroup[]>([]);

    useEffect(() => {
        (async () => {
            if (!user?._id) {
                return;
            }
            setContacts(await contactService.getContacts());
            setContactGroups(await contactGroupService.getContactGroups());
            setLeftGroups(await contactGroupService.getLeftGroups());
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

        const handleContactGroupAutoAdded = (newContactGroup: ContactGroup) => {
            // Skip auto-adding groups that the user has left
            if (user?.leftGroupIds?.includes(newContactGroup._id)) {
                return;
            }
            setContactGroups((prevContactGroups) => {
                const exists = prevContactGroups.some(
                    (c) => c._id === newContactGroup._id,
                );
                if (exists) {
                    return prevContactGroups;
                }
                return [...prevContactGroups, newContactGroup];
            });
        };

        // The server removes the contact when a user is ignored; mirror that so
        // an un-ignored user doesn't reappear as an (outdated) accepted contact.
        const handleUserIgnored = (ignoredUserId: string) => {
            setContacts((prevContacts) =>
                prevContacts.filter((c) => c._id !== ignoredUserId),
            );
            setSelectedContact((prevSelected) =>
                prevSelected?._id === ignoredUserId ? undefined : prevSelected,
            );
        };

        socket.on(SocketMessageTypes.contactAutoAdded, handleContactAutoAdded);
        socket.on(SocketMessageTypes.userIgnored, handleUserIgnored);
        socket.on(
            SocketMessageTypes.contactGroupAutoAdded,
            handleContactGroupAutoAdded,
        );

        return () => {
            socket.off(
                SocketMessageTypes.contactAutoAdded,
                handleContactAutoAdded,
            );
            socket.off(SocketMessageTypes.userIgnored, handleUserIgnored);
            socket.off(
                SocketMessageTypes.contactGroupAutoAdded,
                handleContactGroupAutoAdded,
            );
        };
    }, [socket, setContacts]);

    const rejoinGroup = async (groupId: string): Promise<boolean> => {
        const result = await contactGroupService.rejoinContactGroup(groupId);
        if (!result) {
            return false;
        }

        // Remove from leftGroups and add to contactGroups
        setLeftGroups((prev) => prev.filter((g) => g._id !== groupId));
        setContactGroups((prev) => {
            const exists = prev.some((g) => g._id === result._id);
            if (exists) {
                return prev;
            }
            return [...prev, result];
        });

        return true;
    };

    const leaveGroup = async (groupId: string): Promise<boolean> => {
        const result = await contactGroupService.leaveContactGroup(groupId);
        if (!result) {
            return false;
        }

        // Remove from contactGroups and refresh leftGroups
        setContactGroups((prev) => prev.filter((g) => g._id !== groupId));
        setLeftGroups(await contactGroupService.getLeftGroups());

        return true;
    };

    const updateContactLastMessage = useEffectEvent((message: Message) => {
        // Skip messages from groups that the user has left
        if (user?.leftGroupIds?.includes(message.toUserId)) {
            return;
        }

        // Check if the message belongs to a contact group
        const contactGroupWithNewMessage = contactGroups.find(
            (cg) => cg._id === message.toUserId,
        );
        if (contactGroupWithNewMessage) {
            contactGroupWithNewMessage.lastMessage = message._id;
            setContactGroups([...contactGroups]);
            return;
        }

        // Otherwise, it's a direct contact message
        const userContactWithNewMessage = contacts.find(
            (uc) => uc._id === message.fromUserId,
        );
        if (userContactWithNewMessage) {
            userContactWithNewMessage.lastMessage = message._id;
            setContacts([...contacts]);
        }
    });

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.on(SocketMessageTypes.message, updateContactLastMessage);
        return () => {
            socket.off(SocketMessageTypes.message, updateContactLastMessage);
        };
    }, [socket, contacts, contactGroups]);

    const handleContactProfileUpdated = useEffectEvent(
        async (update: ContactProfileUpdate) => {
            const isOwnProfile = update.userId === user?._id;
            const isContact = contacts.some((c) => c._id === update.userId);
            if (!isOwnProfile && !isContact) {
                return;
            }

            const changes: Partial<Contact> = {};
            if (update.statusText !== undefined) {
                changes.statusText = update.statusText;
            }

            // Another session of the signed in user changed the profile;
            // setUser reloads the avatar bytes itself. The session that made
            // the change receives the update too, so skip it if nothing changed.
            const ownProfileChanged =
                update.avatarUpdated ||
                (update.statusText !== undefined &&
                    update.statusText !== user?.statusText);
            if (isOwnProfile && user && ownProfileChanged) {
                setUser({
                    ...user,
                    ...changes,
                    ...(update.avatarUpdated && {
                        avatarFileName: user._id + "_avatar",
                    }),
                });
            }

            if (!isContact) {
                return;
            }

            if (update.avatarUpdated) {
                // The file name stays the same, so the bytes have to be reloaded
                changes.avatarFileName = update.userId + "_avatar";
                try {
                    const avatarBase64 = await userService.loadAvatar(
                        update.userId,
                    );
                    if (avatarBase64) {
                        changes.avatarBase64 = avatarBase64;
                    }
                } catch (error) {
                    console.error(
                        `Could not reload avatar of ${update.userId}`,
                        error,
                    );
                }
            }

            setContacts((prevContacts) =>
                prevContacts.map((c) =>
                    c._id === update.userId ? { ...c, ...changes } : c,
                ),
            );
            setSelectedContact((prevSelected) =>
                prevSelected?._id === update.userId
                    ? { ...prevSelected, ...changes }
                    : prevSelected,
            );
        },
    );

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.on(
            SocketMessageTypes.contactProfileUpdated,
            handleContactProfileUpdated,
        );
        return () => {
            socket.off(
                SocketMessageTypes.contactProfileUpdated,
                handleContactProfileUpdated,
            );
        };
    }, [socket]);

    return (
        <ContactsContext.Provider
            value={{
                contacts: [contacts, setContacts],
                contactGroups: [contactGroups, setContactGroups],
                leftGroups: [leftGroups, setLeftGroups],
                selectedContact: [selectedContact, setSelectedContact],
                rejoinGroup,
                leaveGroup,
            }}
        >
            {children}
        </ContactsContext.Provider>
    );
}
