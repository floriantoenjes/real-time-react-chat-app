import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import Peer, { DataConnection, MediaConnection } from "peerjs";
import {
    PEERJS_SERVER_HOST,
    PEERJS_SERVER_PORT,
    TURN_SERVER_URL,
} from "../../environment";
import { UserContext } from "./UserContext";
import { useDiContext } from "./DiContext";
import { IconButton } from "@mui/material";
import {
    PhoneIcon,
    PhoneXMarkIcon,
    VideoCameraIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { Avatar } from "../Avatar";
import { ContactsContext } from "./ContactsContext";

export const PeerContext = createContext<{
    startCall: (selectedContact: Contact, video: boolean) => Promise<void>;
}>({
    startCall: async () => {},
});

export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
    const [user] = useContext(UserContext);
    const loggingService = useDiContext().LoggingService;
    const coturnService = useDiContext().CoturnService;

    const [calling, setCalling] = useState<boolean>(false);
    const [peer, setPeer] = useState<Peer | null>(null);
    const [connection, setDataConnection] = useState<DataConnection | null>(
        null,
    );
    const [call, setCall] = useState<MediaConnection | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [callingStream, setCallingStream] = useState<MediaStream | null>(
        null,
    );
    const [receiveCallingStream, setReceiveCallingStream] =
        useState<MediaStream | null>(null);
    const [contacts] = useContext(ContactsContext).contacts;
    const [selectedContact] = useContext(ContactsContext).selectedContact;

    const videoRef = useRef<HTMLVideoElement | null>(null);

    const shutdownCall = useCallback(() => {
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
    }, [stream, receiveCallingStream]);

    const listenOnPeerConnections = useCallback((peer: Peer) => {
        peer.on("connection", (connection) => {
            setDataConnection(connection);

            peer.on("call", (call) => {
                setCall(call);
            });

            connection.on("close", () => {
                setCall(null);
            });
        });
    }, []);

    useEffect(() => {
        try {
            if (user && !peer) {
                coturnService.getCredentials().then((credentials) => {
                    if (!credentials) {
                        return;
                    }

                    const newPeer = new Peer(user.username, {
                        host: PEERJS_SERVER_HOST,
                        port: +PEERJS_SERVER_PORT,
                        path: "/peerjs/myapp",
                        config: {
                            iceServers: [
                                // { url: "stun:stun.l.google.com:19302" }, // Public STUN server for initial connection
                                {
                                    url: TURN_SERVER_URL,
                                    username: credentials.username,
                                    credential: credentials.password,
                                },
                            ],
                            iceTransportPolicy: "relay",
                        },
                    });
                    setPeer(newPeer);

                    newPeer.on("open", (id) => {
                        loggingService.log(
                            `User ${user._id} received Peer-Id: ${id}`,
                        );
                    });

                    newPeer.on("error", (err) => {
                        loggingService.error(
                            `User ${user._id} received Error: ${err}`,
                            undefined,
                            err?.stack,
                        );
                    });
                });
            }
        } catch (e) {
            console.log("Could not connect to Peer server!");
        }
    }, [user?.username]);

    useEffect(() => {
        if (!peer) {
            return;
        }
        listenOnPeerConnections(peer);
    }, [peer, listenOnPeerConnections]);

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
    }, [call, stream, shutdownCall]);

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

    const startCall = useCallback(
        async (selectedContact: Contact, video: boolean) => {
            setCalling(true);

            navigator.mediaDevices
                .getUserMedia({ video, audio: true })
                .then(async (stream) => {
                    setCallingStream(stream);

                    if (!peer) {
                        return;
                    }

                    const connection = peer.connect(selectedContact.name);
                    setDataConnection(connection);

                    connection.on("open", () => {
                        const call = peer.call(selectedContact.name, stream);
                        setCall(call);
                        call.on("stream", (remoteStream) => {
                            // Show stream in some <video> element.
                            setStream(remoteStream);
                        });

                        call.on("close", () => {
                            setCall(null);
                            stream.getTracks().forEach((track) => {
                                track.stop();
                            });
                            setCalling(false);
                        });

                        connection.on("close", () => {
                            setCall(null);
                            stream.getTracks().forEach((track) => {
                                track.stop();
                            });
                            setCalling(false);
                        });
                    });
                })
                .catch((reason) =>
                    loggingService.error(reason, undefined, reason?.stack),
                );
        },
        [peer, loggingService],
    );

    function callingPeerAvatar(contact?: Contact) {
        return contact ? (
            <div className={"flex justify-center"}>
                <Avatar
                    height={"5rem"}
                    width={"5rem"}
                    noMargin={true}
                    user={contact}
                />
            </div>
        ) : (
            <></>
        );
    }

    const callingContact = useMemo(
        () => contacts.find((c) => c.name === connection?.peer),
        [contacts, connection?.peer],
    );

    const contextValue = useMemo(() => ({ startCall }), [startCall]);

    return (
        <>
            {isNeitherCallingNorBeingCalled() && (
                <PeerContext.Provider value={contextValue}>
                    {children}
                </PeerContext.Provider>
            )}
            {isCalling() && (
                <div className={"mx-auto my-auto"}>
                    <h2 className={"text-center"}>Calling</h2>
                    <h2 className={"text-2xl text-center"}>
                        {callingPeerAvatar(selectedContact)}
                        {selectedContact?.name}
                    </h2>
                    <div className={"flex justify-center"}>
                        <IconButton>
                            <XMarkIcon
                                className="w-8 h-8 text-red-600"
                                onClick={endCall}
                            />
                        </IconButton>
                    </div>
                </div>
            )}

            {isBeingCalled() && (
                <div className={"mx-auto my-auto"}>
                    <h2>Incoming call from</h2>
                    <h2 className={"text-2xl text-center"}>
                        <div className={"mx-auto"}>
                            <div className={"mx-auto flex justify-center"}>
                                {callingPeerAvatar(callingContact)}
                            </div>
                        </div>
                        {connection?.peer}
                    </h2>
                    <div className={"flex"}>
                        <IconButton onClick={() => answerCall(true)}>
                            <VideoCameraIcon className="w-8 h-8 fill-yellow-500" />
                        </IconButton>

                        <IconButton onClick={() => answerCall(false)}>
                            <PhoneIcon className="w-8 h-8 fill-green-500" />
                        </IconButton>

                        <IconButton>
                            <XMarkIcon
                                className="w-8 h-8 text-red-600"
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
                <div className={"flex flex-col justify-center w-full"}>
                    <div className={"flex flex-col"}>
                        <div className={"mx-auto"}>
                            <h2>in a call with</h2>
                            <h2 className={"text-2xl text-center"}>
                                <div className={"mx-auto flex justify-center"}>
                                    {!stream?.getVideoTracks().length &&
                                        callingPeerAvatar(callingContact)}
                                </div>
                                {connection?.peer}
                            </h2>
                        </div>
                    </div>
                    <video ref={videoRef}></video>
                    <div className={"flex  justify-center call-bar"}>
                        <IconButton onClick={hangUpCall}>
                            <PhoneXMarkIcon className={"w-8 fill-red-600"} />
                        </IconButton>
                    </div>
                </div>
            )}
        </>
    );
};
