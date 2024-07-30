import { createContext, Dispatch, SetStateAction } from "react";
import Peer from "peerjs";

export const PeerContext = createContext<
    [Peer | null, Dispatch<SetStateAction<Peer | null>>]
>([null, (value) => {}]);
