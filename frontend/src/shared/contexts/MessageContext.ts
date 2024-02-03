import { createContext, Dispatch, SetStateAction } from "react";
import { MessageService } from "../services/MessageService";
import { Message } from "../types/Message";

export const MessageContext = createContext<
    [
        Message[] | undefined,
        Dispatch<SetStateAction<Message[] | undefined>>,
        MessageService,
    ]
>([undefined, (value) => {}, new MessageService()]);
