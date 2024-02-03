import { Message } from "./Message";

export type Contact = {
    _id: string;
    userId: string;
    username: string;
    lastMessage?: Message;
    messages: Message[];
};
