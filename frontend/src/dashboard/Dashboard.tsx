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
import { PeerContext } from "../shared/contexts/PeerContext";
import { IconButton } from "@mui/material";
import {
    PhoneIcon,
    PhoneXMarkIcon,
    VideoCameraIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { SocketContext } from "../shared/contexts/SocketContext";

export function Dashboard(props: { user?: User }) {
    if (!props.user) {
        return <Navigate to={"/"} />;
    }

    const contactService = useRef(useDiContext().ContactService);
    const contactGroupService = useRef(useDiContext().ContactGroupService);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactsOnlineStatus, setContactsOnlineStatus] = useState<
        Map<string, boolean>
    >(new Map<string, boolean>());
    const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
        undefined,
    );

    const [messages, setMessages] = useState<Message[]>([]);
    const [socket] = useContext(SocketContext);

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

    useEffect(() => {
        if (contacts) {
            (async () => {
                const res =
                    await contactService.current.getContactsOnlineStatus(
                        contacts.map((c) => c._id),
                    );
                if (res.status === 200) {
                    const onlineStatusMap = new Map<string, boolean>();
                    for (const userId of Object.keys(res.body)) {
                        onlineStatusMap.set(userId, res.body[userId]);
                    }
                    setContactsOnlineStatus(onlineStatusMap);
                }
            })();
        }
    }, [contacts]);

    useEffect(() => {
        function setContactOnlineStatus(
            contactId: string,
            onlineStatus: boolean,
        ) {
            setContactsOnlineStatus((prevState) => {
                prevState.set(contactId, onlineStatus);
                return new Map(prevState);
            });
        }

        if (socket) {
            socket.on("contactOnline", (contactId: string) => {
                setContactOnlineStatus(contactId, true);
            });

            socket.on("contactOffline", (contactId: string) => {
                setContactOnlineStatus(contactId, false);
            });
        }
    }, [socket]);

    const {
        calling,
        setCalling,
        peer,
        connection,
        setDataConnection,
        call,
        setCall,
        stream,
        setStream,
        callingStream,
        setCallingStream,
        setReceiveCallingStream,
        receiveCallingStream,
    } = useContext(PeerContext);

    useEffect(() => {
        if (!peer) {
            return;
        }
        peer.on("connection", (connection) => {
            setDataConnection(connection);
            peer.on("call", (call) => {
                setCall(call);
            });

            connection.on("close", () => {
                setCall(null);
            });
        });
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

    function answerCall(video: boolean) {
        if (!call) {
            return;
        }

        navigator.mediaDevices.getUserMedia({ video, audio: true }).then(
            (stream) => {
                setReceiveCallingStream(stream);
                call.answer(stream); // Answer the call with an A/V stream.
                call.on("stream", (remoteStream) => {
                    setStream(remoteStream);
                });

                call.on("close", () => {
                    console.log("close");
                    hangUpCall();
                });
            },
            (err) => {
                console.error("Failed to get local stream", err);
            },
        );
    }

    function hangUpCall() {
        if (!call) {
            return;
        }

        call.close();
        setTimeout(() => {
            setCall(null);
        });
    }

    useEffect(() => {
        console.log("call, stream", call, stream, calling);
        if (!call && stream) {
            if (videoRef.current?.srcObject) {
                // @ts-ignore
                for (const track of videoRef.current.srcObject.getTracks()) {
                    track.stop();
                }
                videoRef.current.srcObject = null;

                if (stream) {
                    for (const track of stream.getTracks()) {
                        track.stop();
                    }
                }

                setStream(null);

                if (receiveCallingStream) {
                    for (const track of receiveCallingStream?.getTracks()) {
                        track.stop();
                    }
                    setReceiveCallingStream(null);
                }

                // peer?.destroy();
            }
        }
    }, [call]);

    return (
        <div className={"h-screen flex"}>
            <ContactsContext.Provider
                value={{
                    contacts: [contacts, setContacts],
                    contactsOnlineStatus: [
                        contactsOnlineStatus,
                        setContactsOnlineStatus,
                    ],
                    contactGroups: [contactGroups, setContactGroups],
                    selectedContact: [selectedContact, setSelectedContact],
                }}
            >
                <MessageContext.Provider value={[messages, setMessages]}>
                    {!stream && !calling && !call && (
                        <>
                            <Sidebar />
                            <Chat />
                        </>
                    )}
                    {!stream && calling && (
                        <div className={"mx-auto my-auto"}>
                            <h2>Calling</h2>
                            <div className={"flex"}>
                                <IconButton>
                                    <XMarkIcon
                                        className="w-8 h-8"
                                        onClick={() => {
                                            connection?.close({ flush: true });
                                            if (!callingStream) {
                                                return;
                                            }
                                            for (const track of callingStream?.getTracks()) {
                                                track.stop();
                                            }
                                            setCallingStream(null);
                                            call?.close();
                                            setCall(null);
                                            setCalling(false);
                                        }}
                                    />
                                </IconButton>
                            </div>
                        </div>
                    )}

                    {!calling && call && !stream && (
                        <div className={"mx-auto my-auto"}>
                            <h2>Incoming call</h2>
                            <div className={"flex"}>
                                <IconButton onClick={() => answerCall(true)}>
                                    <VideoCameraIcon className="w-8 h-8" />
                                </IconButton>

                                <IconButton onClick={() => answerCall(false)}>
                                    <PhoneIcon className="w-8 h-8" />
                                </IconButton>

                                <IconButton>
                                    <XMarkIcon
                                        className="w-8 h-8"
                                        onClick={() => {
                                            connection?.close();
                                            hangUpCall();
                                        }}
                                    />
                                </IconButton>
                            </div>
                        </div>
                    )}

                    {stream && (
                        <>
                            <video ref={videoRef}></video>
                            <div className={"fixed call-bar"}>
                                <PhoneXMarkIcon
                                    className={"w-8 fill-red-600"}
                                    onClick={hangUpCall}
                                />
                            </div>
                        </>
                    )}
                </MessageContext.Provider>
            </ContactsContext.Provider>
        </div>
    );
}
