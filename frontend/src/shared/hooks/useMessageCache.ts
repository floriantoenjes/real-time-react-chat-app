import { useContext, useEffect } from "react";
import { Message } from "@t/message.contract";
import { ContactsContext } from "../contexts/ContactsContext";
import { MessageContext, useMessageContext } from "../contexts/MessageContext";
import { useDiContext } from "../contexts/DiContext";
import { MessageService } from "../services/MessageService";
import { useUserContext } from "../contexts/UserContext";
import { Contact } from "@t/contact.contract";
import { ContactGroup, isContactGroup } from "@t/contact-group.contract";

function markMessagesReadAndEmit(
    cached: Message[],
    messageService: MessageService,
) {
    cached.forEach((msg) => {
        if (!msg.read) {
            messageService.setMessageRead(msg._id);
            msg.read = true;
        }
    });
}

function isMessageOfChat(
    msg: Message,
    chat: Contact | ContactGroup,
    userId: string,
) {
    if (isContactGroup(chat)) {
        return msg.toUserId === chat._id;
    }
    return (
        (msg.fromUserId === userId && msg.toUserId === chat._id) ||
        (msg.fromUserId === chat._id && msg.toUserId === userId)
    );
}

/**
 * Custom hook for managing message caching and fetching
 * Handles the complex logic of caching messages per contact and fetching from API
 */
export function useMessageCache() {
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [messages, setMessages] = useContext(MessageContext).messages;
    const messageService = useDiContext().MessageService;
    const messagesCache = useMessageContext().messageCache;
    const [user] = useUserContext();

    // Fetch messages - check cache first
    useEffect(() => {
        let isCurrent = true;

        async function fetchMessages() {
            if (!selectedContact) {
                return;
            }

            const contactId = selectedContact._id;

            // Check cache first
            const cached = messagesCache.current.get(contactId);
            if (cached) {
                if (isCurrent) {
                    markMessagesReadAndEmit(cached, messageService);
                    setMessages(cached);
                }
                return;
            }

            const fetchedMessages = await messageService.getMessages(contactId);

            if (!fetchedMessages) {
                return;
            }

            // Abort if contact changed while fetching
            if (!isCurrent) {
                return;
            }

            // Store in cache and display (use empty array if null)
            const messagesToSet = fetchedMessages ?? [];
            messagesCache.current.set(contactId, messagesToSet);
            // Keep messages of this chat that were sent or received while the
            // history was loading; they are not part of the fetched result yet.
            setMessages((prevState) => {
                const fetchedIds = new Set(messagesToSet.map((msg) => msg._id));
                const pendingMessages = prevState.filter(
                    (msg) =>
                        !fetchedIds.has(msg._id) &&
                        isMessageOfChat(msg, selectedContact, user._id),
                );
                return [...messagesToSet, ...pendingMessages];
            });
        }
        void fetchMessages();

        return () => {
            isCurrent = false;
        };
    }, [selectedContact?._id, messageService, setMessages]);

    // Sync cache when messages change (handles sent messages from SendMessageBar)
    useEffect(() => {
        if (selectedContact) {
            messagesCache.current.set(selectedContact._id, messages);
        }
    }, [messages, selectedContact?._id]);

    // Get messages from cache for the current selected contact
    const getCachedMessages = (contactId: string): Message[] | undefined => {
        return messagesCache.current.get(contactId);
    };

    return {
        getCachedMessages,
    };
}
