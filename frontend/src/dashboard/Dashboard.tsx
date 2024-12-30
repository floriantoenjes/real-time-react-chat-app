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
import Peer from "peerjs";
import { RoutesEnum } from "../shared/enums/routes";

export function Dashboard(props: { user?: User }) {
    const isLoggedIn = props.user;
    if (!isLoggedIn) {
        return <Navigate to={RoutesEnum.LOGIN} />;
    }

    const videoRef = useRef<HTMLVideoElement | null>(null);

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
        receiveCallingStream,
        setReceiveCallingStream,
    } = useContext(PeerContext);

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
        if (!contacts) {
            return;
        }
        (async () => {
            await getContactsOnlineStatus();
        })();
    }, [contacts]);

    useEffect(() => {
        listenOnContactOnlineStatusChanges();
    }, [socket]);

    useEffect(() => {
        if (!peer) {
            return;
        }
        listenOnPeerConnections(peer);
    }, [peer]);

    useEffect(() => {
        if (!videoRef.current || !stream) {
            return;
        }
        showVideoStream(videoRef.current, stream);
    }, [stream]);

    useEffect(() => {
        if (!call && stream) {
            shutdownCall();
        }
    }, [call]);

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
                    hangUpCall();
                });
            },
            (err) => {
                console.error("Failed to get local stream", err);
            },
        );
    }

    function showVideoStream(videoRef: HTMLVideoElement, stream: MediaStream) {
        videoRef.srcObject = stream;
        videoRef.addEventListener("loadedmetadata", () => {
            if (!videoRef) {
                return;
            }

            void videoRef.play();
        });
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

    function shutdownCall() {
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

    function listenOnContactOnlineStatusChanges() {
        function setContactOnlineStatusOnOrOffline(
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
                setContactOnlineStatusOnOrOffline(contactId, true);
            });

            socket.on("contactOffline", (contactId: string) => {
                setContactOnlineStatusOnOrOffline(contactId, false);
            });
        }
    }

    function listenOnPeerConnections(peer: Peer) {
        peer.on("connection", (connection) => {
            setDataConnection(connection);

            peer.on("call", (call) => {
                setCall(call);
            });

            connection.on("close", () => {
                setCall(null);
            });
        });
    }

    async function getContactsOnlineStatus() {
        const res = await contactService.current.getContactsOnlineStatus(
            contacts.map((c) => c._id),
        );
        if (res.status === 200) {
            const onlineStatusMap = new Map<string, boolean>();
            for (const userId of Object.keys(res.body)) {
                onlineStatusMap.set(userId, res.body[userId]);
            }
            setContactsOnlineStatus(onlineStatusMap);
        }
    }

    function endCall() {
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
    }

    function isCalling() {
        return !stream && calling;
    }

    function isBeingCalled() {
        return !calling && call && !stream;
    }

    function isNeitherCallingNorBeingCalled() {
        return !stream && !calling && !call;
    }

    function isInCall() {
        return !!stream;
    }

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
                    {isNeitherCallingNorBeingCalled() && (
                        <>
                            <Sidebar />
                            <Chat />
                        </>
                    )}
                    {isCalling() && (
                        <div className={"mx-auto my-auto"}>
                            <h2>Calling</h2>
                            <div className={"flex"}>
                                <IconButton>
                                    <XMarkIcon
                                        className="w-8 h-8"
                                        onClick={endCall}
                                    />
                                </IconButton>
                            </div>
                        </div>
                    )}

                    {isBeingCalled() && (
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

                    {isInCall() && (
                        <>
                            <video ref={videoRef}></video>
                            <div className={"fixed call-bar"}>
                                <IconButton onClick={hangUpCall}>
                                    <PhoneXMarkIcon
                                        className={"w-8 fill-red-600"}
                                    />
                                </IconButton>
                            </div>
                        </>
                    )}
                </MessageContext.Provider>
            </ContactsContext.Provider>
        </div>
    );
}
