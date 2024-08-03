import { createContext, Dispatch, SetStateAction } from "react";
import Peer, { DataConnection, MediaConnection } from "peerjs";

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
