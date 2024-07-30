import { createContext, Dispatch, SetStateAction } from "react";
import Peer from "peerjs";

export function initCalls(
    peer: Peer,
    setStream: Dispatch<SetStateAction<MediaStream | null>>,
) {
    peer.on("call", (call) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(
            (stream) => {
                call.answer(stream); // Answer the call with an A/V stream.
                call.on("stream", (remoteStream) => {
                    setStream(remoteStream);
                });
            },
            (err) => {
                console.error("Failed to get local stream", err);
            },
        );
    });
}

export const PeerContext = createContext<{
    peer: Peer | null;
    setPeer: Dispatch<SetStateAction<Peer | null>>;
    stream: MediaStream | null;
    setStream: Dispatch<SetStateAction<MediaStream | null>>;
}>({
    peer: null,
    setPeer: (value) => {},
    stream: null,
    setStream: () => {},
});
