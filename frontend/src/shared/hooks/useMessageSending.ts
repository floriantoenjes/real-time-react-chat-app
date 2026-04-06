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

function updateContactWithNewLastMessage(
    setContacts: (
        value: ((prevState: Contact[]) => Contact[]) | Contact[],
    ) => void,
    selectedContact: Contact,
    messageObj: Message,
) {
    // Update contacts last message
    setContacts((prevState) => {
        const contact = prevState.find((c) => c._id === selectedContact._id);
        if (contact && messageObj) {
            contact.lastMessage = messageObj._id;
            return [...prevState];
        }
        return prevState;
    });
}

function updateContactGroupWithNewLastMessage(
    setContactGroups: (
        value: ((prevState: ContactGroup[]) => ContactGroup[]) | ContactGroup[],
    ) => void,
    selectedContact: Contact,
    messageObj: Message,
) {
    // Update contact groups last message
    setContactGroups((prevState) => {
        const contactGroup = prevState.find(
            (cg) => cg._id === selectedContact._id,
        );
        if (contactGroup && messageObj) {
            contactGroup.lastMessage = messageObj._id;
            return [...prevState];
        }
        return prevState;
    });
}

/**
 * Custom hook for handling message sending functionality
 * @param selectedContact - The currently selected contact or contact group
 * @returns Object containing message sending functions and state
 */
export function useMessageSending(selectedContact: Contact | ContactGroup) {
    const [user] = useUserContext();
    const [messages, setMessages] = useContext(MessageContext).messages;
    const [, setContacts] = useContext(ContactsContext).contacts;
    const [, setContactGroups] = useContext(ContactsContext).contactGroups;
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
        const updatedMessages = [
            ...messages,
            {
                ...messageToSend,
                _id: MessageAddons.TEMP_PREFIX + +new Date(),
                at: new Date(),
                read: false,
                sent: false,
                type,
            } satisfies Message,
        ];
        const updatedMessageIndex = updatedMessages.length - 1;
        setMessages(updatedMessages);

        // Send message via service
        const messageObj = await messageService.sendMessage(
            message,
            selectedContact._id,
            type,
        );
        if (!messageObj) {
            return;
        }

        if ("memberIds" in selectedContact) {
            updateContactGroupWithNewLastMessage(
                setContactGroups,
                selectedContact,
                messageObj,
            );
        } else {
            updateContactWithNewLastMessage(
                setContacts,
                selectedContact,
                messageObj,
            );
        }

        // Replace temporary message with real one
        setMessages((prevState) => {
            prevState[updatedMessageIndex] = {
                ...prevState[updatedMessageIndex],
                _id: messageObj._id,
                sent: messageObj.sent,
            };
            return [...prevState];
        });
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
