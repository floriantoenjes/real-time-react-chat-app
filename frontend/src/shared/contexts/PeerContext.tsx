import React, {
    createContext,
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import Peer, { DataConnection, MediaConnection } from "peerjs";
import {
    PEERJS_SERVER_HOST,
    PEERJS_SERVER_PORT,
    TURN_SERVER_PASSWORD,
    TURN_SERVER_URL,
    TURN_SERVER_USERNAME,
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

export const PeerContext = createContext<{
    calling: boolean;
    setCalling: Dispatch<SetStateAction<boolean>>;
    callingStream: MediaStream | null;
    setCallingStream: Dispatch<SetStateAction<MediaStream | null>>;
    receiveCallingStream: MediaStream | null;
    setReceiveCallingStream: Dispatch<SetStateAction<MediaStream | null>>;
    peer: Peer | null;
    setPeer: Dispatch<SetStateAction<Peer | null>>;
    connection: DataConnection | null;
    setDataConnection: Dispatch<SetStateAction<DataConnection | null>>;
    call: MediaConnection | null;
    setCall: Dispatch<SetStateAction<MediaConnection | null>>;
    stream: MediaStream | null;
    setStream: Dispatch<SetStateAction<MediaStream | null>>;
}>({
    calling: false,
    setCalling: (value) => {},
    callingStream: null,
    setCallingStream: () => {},
    receiveCallingStream: null,
    setReceiveCallingStream: () => {},
    peer: null,
    setPeer: (value) => {},
    connection: null,
    setDataConnection: () => {},
    call: null,
    setCall: () => {},
    stream: null,
    setStream: () => {},
});

export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
    const [user] = useContext(UserContext);
    const loggingService = useDiContext().LoggingService;

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

    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        try {
            if (user && !peer) {
                const newPeer = new Peer(user.username, {
                    host: PEERJS_SERVER_HOST,
                    port: +PEERJS_SERVER_PORT,
                    path: "/peerjs/myapp",
                    config: {
                        iceServers: [
                            // { url: "stun:stun.l.google.com:19302" }, // Public STUN server for initial connection
                            {
                                url: TURN_SERVER_URL,
                                username: TURN_SERVER_USERNAME,
                                credential: TURN_SERVER_PASSWORD,
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
        <>
            {isNeitherCallingNorBeingCalled() && (
                <PeerContext.Provider
                    value={{
                        calling,
                        setCalling,
                        callingStream,
                        setCallingStream,
                        peer,
                        setPeer,
                        connection,
                        setDataConnection,
                        call,
                        setCall,
                        stream,
                        setStream,
                        receiveCallingStream,
                        setReceiveCallingStream,
                    }}
                >
                    {children}
                </PeerContext.Provider>
            )}
            {isCalling() && (
                <div className={"mx-auto my-auto"}>
                    <h2>Calling</h2>
                    <div className={"flex"}>
                        <IconButton>
                            <XMarkIcon className="w-8 h-8" onClick={endCall} />
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
                            <PhoneXMarkIcon className={"w-8 fill-red-600"} />
                        </IconButton>
                    </div>
                </>
            )}
        </>
    );
};
