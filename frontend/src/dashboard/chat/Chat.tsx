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
import { useI18nContext } from "../../i18n/i18n-react";
import { SocketMessageTypes } from "@t/socket-message-types.enum";

export function Chat() {
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [user] = useUserContext();
    const [messages, setMessages] = useContext(MessageContext);
    const [socket] = useContext(SocketContext);
    const messageService = useDiContext().MessageService;
    const { LL } = useI18nContext();

    useEffect(() => {
        async function fetchMessages() {
            if (!selectedContact) {
                return;
            }

            const messages = await messageService.getMessages(
                user._id,
                selectedContact._id,
            );
            if (!messages) {
                return;
            }

            setMessages(messages);
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
            socket.once(SocketMessageTypes.message, addMessage);

            socket.on(SocketMessageTypes.messageRead, (msgId: string) => {
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
