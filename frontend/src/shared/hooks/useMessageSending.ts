import { useContext, useState } from "react";
import { MessageContext } from "../contexts/MessageContext";
import { ContactsContext } from "../contexts/ContactsContext";
import { useDiContext } from "../contexts/DiContext";
import { useUserContext } from "../contexts/UserContext";
import { SocketContext } from "../contexts/SocketContext";
import { Message } from "@t/message.contract";
import { MessageAddons } from "../enums/message";
import { SocketMessageTypes } from "@t/socket-message-types.enum";
import { Contact } from "@t/contact.contract";
import { ContactGroup } from "@t/contact-group.contract";

/**
 * Custom hook for handling message sending functionality
 * @param selectedContact - The currently selected contact or contact group
 * @returns Object containing message sending functions and state
 */
export function useMessageSending(selectedContact: Contact | ContactGroup) {
    const [user] = useUserContext();
    const [messages, setMessages] = useContext(MessageContext).messages;
    const [, setContacts] = useContext(ContactsContext).contacts;
    const messageService = useDiContext().MessageService;
    const [socket] = useContext(SocketContext);
    const [isTyping, setIsTyping] = useState<boolean>(false);

    async function sendMessage(
        message: string,
        type: Message["type"] = "text",
    ) {
        // Send typing false event
        socket?.emit(SocketMessageTypes.typing, {
            userId: user._id,
            contactId: selectedContact?._id,
            isTyping: false,
        });

        const messageToSend = {
            message,
            fromUserId: user._id,
            toUserId: selectedContact._id,
        };

        // Add temporary message to UI
        setMessages([
            ...messages,
            {
                ...messageToSend,
                _id: MessageAddons.TEMP_PREFIX + +new Date(),
                at: new Date(),
                read: false,
                sent: false,
                type,
            },
        ]);

        // Send message via service
        const messageObj = await messageService.sendMessage(
            message,
            selectedContact._id,
            type,
        );

        // Update contact's last message
        setContacts((prevState) => {
            const contact = prevState.find(
                (c) => c._id === selectedContact._id,
            );
            if (contact && messageObj) {
                contact.lastMessage = messageObj._id;
                return [...prevState];
            }
            return prevState;
        });

        // Replace temporary message with real one
        if (messageObj) {
            setMessages((prevState) => {
                const msgIdx = prevState.findIndex(
                    (msg) =>
                        msg.fromUserId === messageToSend.fromUserId &&
                        msg.toUserId === messageToSend.toUserId &&
                        msg.message === messageToSend.message,
                );
                prevState[msgIdx] = messageObj;
                return [...prevState];
            });
        }
    }

    async function sendIsTyping() {
        if (isTyping) {
            return;
        }
        setIsTyping(true);
        socket?.emit(SocketMessageTypes.typing, {
            userId: user._id,
            contactId: selectedContact?._id,
            isTyping: true,
        });

        setTimeout(() => {
            setIsTyping(false);
        }, 5000);
    }

    return {
        sendMessage,
        sendIsTyping,
    };
}
