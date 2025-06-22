import React, {
    createContext,
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
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

    return (
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
    );
};
