import "./Dashboard.css";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { ContactsContext } from "../shared/contexts/ContactsContext";
import { MessageContext } from "../shared/contexts/MessageContext";
import { User } from "real-time-chat-backend/shared/user.contract";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { Message } from "real-time-chat-backend/shared/message.contract";
import { ContactGroup } from "real-time-chat-backend/shared/contact-group.contract";
import { useDiContext } from "../shared/contexts/DiContext";
import { initCalls, PeerContext } from "../shared/contexts/PeerContext";
import { ChevronLeftIcon } from "@heroicons/react/16/solid";

export function Dashboard(props: { user?: User }) {
    if (!props.user) {
        return <Navigate to={"/"} />;
    }

    const contactService = useRef(useDiContext().ContactService);
    const contactGroupService = useRef(useDiContext().ContactGroupService);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
        undefined,
    );

    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        (async () => {
            if (!props.user?._id) {
                return;
            }

            setContacts(
                await contactService.current.getContacts(
                    props.user._id.toString(),
                ),
            );

            setContactGroups(
                await contactGroupService.current.getContactGroups(
                    props.user._id.toString(),
                ),
            );
        })();
    }, [props.user, contactService]);

    const { peer, stream, setStream } = useContext(PeerContext);

    useEffect(() => {
        if (!peer) {
            return;
        }
        initCalls(peer, setStream);
    }, [peer]);

    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
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

    return (
        <div className={"h-screen flex"}>
            <ContactsContext.Provider
                value={{
                    contacts: [contacts, setContacts],
                    contactGroups: [contactGroups, setContactGroups],
                    selectedContact: [selectedContact, setSelectedContact],
                }}
            >
                <MessageContext.Provider value={[messages, setMessages]}>
                    {!stream && (
                        <>
                            <Sidebar />
                            <Chat />
                        </>
                    )}

                    {stream && (
                        <>
                            <ChevronLeftIcon
                                className={"w-8"}
                                onClick={() => {
                                    if (videoRef.current?.srcObject) {
                                        // @ts-ignore
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
                </MessageContext.Provider>
            </ContactsContext.Provider>
        </div>
    );
}
