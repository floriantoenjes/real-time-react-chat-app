import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useState,
} from "react";
import { Message } from "@t/message.contract";

export const MessageContext = createContext<
    [Message[], Dispatch<SetStateAction<Message[]>>]
>([[], () => {}]);

export function MessageProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([]);

    return (
        <MessageContext.Provider value={[messages, setMessages]}>
            {children}
        </MessageContext.Provider>
    );
}
