import { createContext } from "react";
import { MessageService } from "../services/MessageService";

export const MessageContext = createContext(new MessageService());
