import { createContext, Dispatch, SetStateAction } from "react";
import { Message } from "@t/message.contract";

export const MessageContext = createContext<
    [Message[], Dispatch<SetStateAction<Message[]>>]
>([[], (value) => {}]);
