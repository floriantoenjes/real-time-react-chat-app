import { createContext } from "react";
import { MessageService } from "../services/MessageService";

export const MessageContext = createContext<MessageService>(
    new MessageService(),
);
