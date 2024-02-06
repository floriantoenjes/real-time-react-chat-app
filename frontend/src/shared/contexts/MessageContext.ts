import { createContext, Dispatch, SetStateAction } from "react";
import { MessageService } from "../services/MessageService";
import { Message } from "backend/shared/contact.contract";

export const MessageContext = createContext<
    [Message[], Dispatch<SetStateAction<Message[]>>, MessageService]
>([[], (value) => {}, new MessageService()]);
