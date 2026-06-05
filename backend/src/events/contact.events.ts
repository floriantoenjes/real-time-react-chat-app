import { Contact } from '../../shared/contact.contract';
import { ContactGroup } from '../../shared/contact-group.contract';

/**
 * Emitted when a contact should be auto-added (e.g., after receiving first message)
 * Listeners: ContactService
 */
export interface ContactAutoAddEvent {
    userId: string; // User to add contact to
    contactUserId: string; // Contact to add
}

/**
 * Emitted when a contact group should be auto-added (e.g., after receiving first group message)
 * Listeners: ContactService, RealTimeChatGateway
 */
export interface ContactGroupAutoAddEvent {
    userId: string;
    group: ContactGroup;
}

/**
 * Emitted when a contact is added
 * Listeners: RealTimeChatGateway
 */
export interface ContactAddedEvent {
    userId: string;
    contact: Contact;
}

/**
 * Emitted when a contact is removed
 * Listeners: RealTimeChatGateway
 */
export interface ContactRemovedEvent {
    userId: string;
    contactId: string;
}
