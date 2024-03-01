import { createContext, Dispatch, SetStateAction } from "react";
import { Message } from "real-time-chat-backend/dist/shared/message.contract";

export const MessageContext = createContext<
    [Message[], Dispatch<SetStateAction<Message[]>>]
>([[], (value) => {}]);
