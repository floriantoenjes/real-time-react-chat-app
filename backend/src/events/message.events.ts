import { Message } from '../../shared/message.contract';

export interface MessageSentEvent {
    fromUserId: string;
    toUserId: string;
    messageId: string;
    message: Message;
    isGroup: boolean;
}

export interface MessageReadEvent {
    messageId: string;
    readerUserId: string;
}
