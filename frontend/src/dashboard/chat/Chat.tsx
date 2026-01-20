import React, { useContext, useEffect, useRef } from "react";
import { MainChat } from "./main-chat/MainChat";
import { SendMessageBar } from "./send-message-bar/SendMessageBar";
import { TopBar } from "./top-bar/TopBar";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { SocketContext } from "../../shared/contexts/SocketContext";
import { useUserContext } from "../../shared/contexts/UserContext";
import { MessageContext } from "../../shared/contexts/MessageContext";
import { Message } from "real-time-chat-backend/shared/message.contract";
import { useDiContext } from "../../shared/contexts/DiContext";
import { MessageAddons } from "../../shared/enums/message";
import { useI18nContext } from "../../i18n/i18n-react";
import { SocketMessageTypes } from "@t/socket-message-types.enum";

export function Chat() {
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [user] = useUserContext();
    const [messages, setMessages] = useContext(MessageContext);
    const [socket] = useContext(SocketContext);
    const messageService = useDiContext().MessageService;
    const { LL } = useI18nContext();
    const messagesCache = useRef<Map<string, Message[]>>(new Map());
    const selectedContactRef = useRef(selectedContact);
    const userIdRef = useRef(user._id);

    // Keep refs in sync
    useEffect(() => {
        selectedContactRef.current = selectedContact;
        userIdRef.current = user._id;
    }, [selectedContact, user._id]);

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
                    setMessages(cached);
                }
                return;
            }

            // Fetch from API
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
    }, [selectedContact?._id, setMessages, messageService]);

    // Sync cache when messages change (handles sent messages from SendMessageBar)
    useEffect(() => {
        if (selectedContact) {
            messagesCache.current.set(selectedContact._id, messages);
        }
    }, [messages, selectedContact?._id]);

    useEffect(() => {
        if (!socket) {
            return;
        }

        function addMessage(message: Message) {
            // Determine which contact this message belongs to
            const contactId =
                message.fromUserId === userIdRef.current
                    ? message.toUserId
                    : message.fromUserId;

            // Always update cache
            const cached = messagesCache.current.get(contactId) ?? [];
            messagesCache.current.set(contactId, [...cached, message]);

            // Update display if viewing that contact
            if (selectedContactRef.current?._id === contactId) {
                setMessages((prev) => [...prev, message]);
                messageService.setMessageRead(message._id);
            }
        }

        function handleMessageRead(msgId: string) {
            setMessages((prevState) => {
                const nowReadMsgIdx = prevState.findIndex((msg) => {
                    return (
                        msg._id === msgId ||
                        msg._id.startsWith(MessageAddons.TEMP_PREFIX)
                    );
                });
                if (!prevState[nowReadMsgIdx]) {
                    return prevState;
                }
                prevState[nowReadMsgIdx].read = true;
                return [...prevState];
            });
        }

        socket.on(SocketMessageTypes.message, addMessage);
        socket.on(SocketMessageTypes.messageRead, handleMessageRead);

        return () => {
            socket.off(SocketMessageTypes.message, addMessage);
            socket.off(SocketMessageTypes.messageRead, handleMessageRead);
        };
    }, [socket, setMessages, messageService]);

    return selectedContact ? (
        <div className={"h-screen w-full overflow-y-scroll"}>
            <TopBar selectedContact={selectedContact} />
            <MainChat />
            <SendMessageBar selectedContact={selectedContact} />
        </div>
    ) : (
        <div className={"w-full flex justify-center items-center"}>
            <h2 className={"text-2xl"}>Welcome to Florians Chat!</h2>
        </div>
    );
}
