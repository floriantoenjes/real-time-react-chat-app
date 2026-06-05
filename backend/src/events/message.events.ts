import { Message } from '../../shared/message.contract';

export interface MessageSentEvent {
    message: Message;
    recipientId: string;
}

export interface MessageReadEvent {
    messageId: string;
    readerUserId: string;
}
