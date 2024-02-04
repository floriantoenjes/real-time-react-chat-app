import { createContext, Dispatch, SetStateAction } from "react";
import { MessageService } from "../services/MessageService";
import { Message } from "../types/Message";

export const MessageContext = createContext<
    [Message[], Dispatch<SetStateAction<Message[]>>, MessageService]
>([[], (value) => {}, new MessageService()]);
