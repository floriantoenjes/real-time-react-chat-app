import { Message } from "./Message";

export type Contact = {
    userId: string;
    lastMessage?: Message;
    messages: Message[];
};
