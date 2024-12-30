import React, { useContext, useEffect } from "react";
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

export function Chat() {
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [user] = useUserContext();
    const [messages, setMessages] = useContext(MessageContext);
    const [socket] = useContext(SocketContext);
    const messageService = useDiContext().MessageService;

    useEffect(() => {
        async function fetchMessages() {
            if (!selectedContact) {
                return;
            }

            setMessages(
                await messageService.getMessages(user._id, selectedContact._id),
            );
        }
        void fetchMessages();
    }, [user, selectedContact, setMessages, messageService, socket?.connected]);

    useEffect(() => {
        function addMessage(message: Message) {
            const newMessageData = [...(messages ?? [])];
            newMessageData.push(message);
            messageService.setMessageRead(message._id);
            setMessages(newMessageData);
        }

        if (socket) {
            socket.once("message", addMessage);

            socket.on("messageRead", (msgId: string) => {
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
            });
        }
    }, [socket, messages, user.username, setMessages]);

    return selectedContact ? (
        <div className={"h-screen w-full overflow-y-scroll"}>
            <TopBar />
            <MainChat />
            <SendMessageBar />
        </div>
    ) : (
        <div></div>
    );
}
