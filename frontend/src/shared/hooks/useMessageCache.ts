import { useContext, useEffect } from "react";
import { Message } from "@t/message.contract";
import { ContactsContext } from "../contexts/ContactsContext";
import { MessageContext, useMessageContext } from "../contexts/MessageContext";
import { useDiContext } from "../contexts/DiContext";
import { MessageService } from "../services/MessageService";

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

/**
 * Custom hook for managing message caching and fetching
 * Handles the complex logic of caching messages per contact and fetching from API
 */
export function useMessageCache() {
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [messages, setMessages] = useContext(MessageContext).messages;
    const messageService = useDiContext().MessageService;
    const messagesCache = useMessageContext().messageCache;

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
            setMessages(messagesToSet);
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
