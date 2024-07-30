import React, { useContext, useEffect, useRef, useState } from "react";
import { MainChat } from "./main-chat/MainChat";
import { SendMessageBar } from "./send-message-bar/SendMessageBar";
import { TopBar } from "./top-bar/TopBar";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { SocketContext } from "../../shared/contexts/SocketContext";
import { useUserContext } from "../../shared/contexts/UserContext";
import { MessageContext } from "../../shared/contexts/MessageContext";
import { Message } from "real-time-chat-backend/shared/message.contract";
import { useDiContext } from "../../shared/contexts/DiContext";
import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { PeerContext } from "../../shared/contexts/PeerContext";

export function Chat() {
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [user] = useUserContext();
    const [messages, setMessages] = useContext(MessageContext);
    const [socket] = useContext(SocketContext);
    const messageService = useDiContext().MessageService;

    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [peer, setPeer] = useContext(PeerContext);

    useEffect(() => {
        async function fetchMessages() {
            if (!selectedContact) {
                return;
            }

            setMessages(
                await messageService.getMessages(user._id, selectedContact._id),
            );
        }
        console.log("fetching messages");
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
                        return msg._id === msgId || msg._id.startsWith("temp-");
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

    useEffect(() => {
        console.log("in effect", stream);
        if (!videoRef.current || !stream) {
            return;
        }
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadedmetadata", () => {
            if (!videoRef.current) {
                return;
            }

            void videoRef.current.play();
        });
    }, [stream]);

    return selectedContact ? (
        <div className={"h-screen w-full overflow-y-scroll"}>
            {stream && (
                <>
                    <ChevronLeftIcon
                        className={"w-8"}
                        onClick={() => {
                            if (videoRef.current?.srcObject) {
                                for (const track of videoRef.current.srcObject.getTracks()) {
                                    track.stop();
                                    alert("stopped src track");
                                }
                                videoRef.current.srcObject = null;

                                for (const track of stream.getTracks()) {
                                    track.stop();
                                    alert("stopped stream track");
                                }
                                setStream(null);
                                alert("set stream null");

                                console.log("destroy peer", peer);
                                peer?.destroy();
                                console.log("destroyed peer", peer);
                            }
                        }}
                    />
                    <video ref={videoRef}></video>
                </>
            )}
            {!stream && (
                <>
                    <TopBar stream={stream} setStream={setStream} />
                    <MainChat />
                    <SendMessageBar />
                </>
            )}
        </div>
    ) : (
        <div></div>
    );
}
