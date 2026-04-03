import { useContext, useEffect, useState } from "react";
import { Message } from "@t/message.contract";
import { useDiContext } from "../contexts/DiContext";
import { ContactsContext } from "../contexts/ContactsContext";

type MessageId = string;

type UserContact = {
    _id: string;
    name: string;
    memberIds?: string[];
    lastMessage?: MessageId | undefined;
    avatarFileName?: string | undefined;
    avatarBase64?: any;
};

export function useLastContactMessageCache() {
    const messageService = useDiContext().MessageService;
    const contactsContext = useContext(ContactsContext);

    const [userContacts] = contactsContext.contacts;

    const [lastMessageCache, setLastMessageCache] = useState(
        new Map<MessageId, Message>(),
    );

    const [loaded, setLoaded] = useState<boolean>(false);

    // Refresh last message cache
    useEffect(() => {
        async function getUserContactLastMessage(userContact: UserContact) {
            if (userContact.lastMessage) {
                const message = await messageService.getMessageById(
                    userContact.lastMessage,
                );
                if (!message) {
                    return;
                }
                return message;
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

            getUserContactLastMessage(userContact).then((lastMessageObj) => {
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

    return { loaded, lastMessageCache };
}
