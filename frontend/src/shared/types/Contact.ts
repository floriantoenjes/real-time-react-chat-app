import { Message } from "../contract";

export type ContactOLD = {
    _id: string;
    userId: string;
    username: string;
    lastMessage?: Message;
    messages: Message[];
};
