import { Message } from "./Message";

export type Contact = {
    userId: string;
    username: string;
    lastMessage?: Message;
    messages: Message[];
};
