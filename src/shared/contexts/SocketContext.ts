import { createContext, Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";

export const SocketContext = createContext<
    [Socket | undefined, Dispatch<SetStateAction<Socket | undefined>>]
>([undefined, () => {}]);
