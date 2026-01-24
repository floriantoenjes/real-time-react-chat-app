import { useContext, useEffect, useState } from "react";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useOnlineStatus } from "../../../shared/contexts/OnlineStatusContext";
import { Contact } from "../../../shared/Contact";
import { useDiContext } from "../../../shared/contexts/DiContext";
import { Message } from "@t/message.contract";

type MessageId = string;

type UserContact = {
    _id: string;
    name: string;
    memberIds?: string[];
    lastMessage?: MessageId | undefined;
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
    const messageService = useDiContext().MessageService;
    const [lastMessageCache, setLastMessageCache] = useState(
        new Map<MessageId, Message>(),
    );
    const [loaded, setLoaded] = useState<boolean>(false);

    function sortByLastMessageDateTime(
        uc1Message?: Message,
        uc2Message?: Message,
    ) {
        if (uc1Message && uc2Message) {
            return -uc1Message.at
                .toString()
                .localeCompare(uc2Message.at.toString());
        }

        return 0;
    }

    // Refresh last message cache
    useEffect(() => {
        async function getUserContactMessages(userContact: UserContact) {
            if (userContact.lastMessage) {
                const res = await messageService.getMessageById(
                    userContact.lastMessage,
                );
                if (res.status === 200) {
                    return res.body.message;
                }
            }
        }

        for (const userContact of userContacts) {
            if (
                userContact.lastMessage &&
                lastMessageCache.get(userContact.lastMessage)
            ) {
                if (userContacts.at(-1) === userContact) {
                    setLoaded(true);
                }
                continue;
            }

            getUserContactMessages(userContact).then((lastMessageObj) => {
                const lastMessage = userContact.lastMessage;
                if (lastMessage && lastMessageObj) {
                    setLastMessageCache((prevState) => {
                        return new Map(
                            prevState.set(lastMessage, lastMessageObj),
                        );
                    });
                }
                if (userContacts.at(-1) === userContact) {
                    setLoaded(true);
                }
            });
        }
    }, [userContacts]);

    const contactElements = userContacts
        .concat(userContactGroups)
        .filter((contact) =>
            props.nameFilter !== undefined
                ? contact.name
                      .toLowerCase()
                      .match(props.nameFilter.toLowerCase())
                : true,
        )
        .sort((uc1, uc2) => {
            const uc1LastMessage = uc1.lastMessage;
            const uc2LastMessage = uc2.lastMessage;

            if (!uc1LastMessage || !uc2LastMessage) {
                if (!uc1LastMessage) {
                    return 1;
                }
                if (!uc2LastMessage) {
                    return -1;
                }
            }

            return sortByLastMessageDateTime(
                lastMessageCache.get(uc1LastMessage),
                lastMessageCache.get(uc2LastMessage),
            );
        })
        .map((contact) => {
            return (
                <Contact
                    key={contact.name}
                    contact={contact}
                    selectedContact={selectedContact}
                    onContactSelect={() => setSelectedContact(contact)}
                    isOnline={contactsOnlineStatus.get(contact._id)}
                    lastMessage={
                        contact.lastMessage
                            ? lastMessageCache.get(contact.lastMessage)
                            : undefined
                    }
                />
            );
        });

    return <div>{loaded && contactElements}</div>;
}
