import { Contact } from '../../shared/contact.contract';
import { ContactGroup } from '../../shared/contact-group.contract';

export interface ContactAutoAddEvent {
    userId: string;
    contactUserId: string;
}

export interface ContactGroupAutoAddEvent {
    userId: string;
    group: ContactGroup;
}

export interface ContactAddedEvent {
    userId: string;
    contact: Contact;
}
