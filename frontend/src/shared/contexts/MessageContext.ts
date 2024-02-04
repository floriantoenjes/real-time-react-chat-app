import { createContext, Dispatch, SetStateAction } from "react";
import { MessageService } from "../services/MessageService";
import { Message } from "real-time-chat-backend/dist/shared/contract";

export const MessageContext = createContext<
    [Message[], Dispatch<SetStateAction<Message[]>>, MessageService]
>([[], (value) => {}, new MessageService()]);
