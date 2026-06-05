import { Message } from '../../shared/message.contract';
import { ContactGroup } from '../../shared/contact-group.contract';

/**
 * Emitted when a message is successfully sent
 * Listeners: ContactService (auto-add), RealTimeChatGateway (broadcast)
 */
export interface MessageSentEvent {
    fromUserId: string;
    toUserId: string;
    messageId: string;
    message: Message;
    isGroup: boolean;
}

/**
 * Emitted when a message is marked as read
 * Listeners: RealTimeChatGateway (broadcast read receipt)
 */
export interface MessageReadEvent {
    messageId: string;
    readerUserId: string;
}

/**
 * Emitted when messages are deleted
 * Listeners: RealTimeChatGateway (broadcast deletion)
 */
export interface MessageDeletedEvent {
    fromUserId: string;
    toUserId: string;
}
