import { Message } from '../../shared/message.contract';

export interface MessageSentEvent {
    message: Message;
    toUserId: string;
}

export interface MessageReadEvent {
    messageId: string;
    readerUserId: string;
}
