/**
 * Event names enum for type-safe event handling
 */
export enum EventNames {
    // Message events
    MESSAGE_SENT = 'message.sent',
    MESSAGE_READ = 'message.read',

    // Contact events
    CONTACT_AUTO_ADD = 'contact.auto-add',
    CONTACT_ADDED = 'contact.added',

    // Contact group events
    CONTACT_GROUP_AUTO_ADD = 'contact-group.auto-add',

    // User events
    USER_CREATED = 'user.created',
    USER_IGNORED = 'user.ignored',
    USER_UNIGNORED = 'user.unignored',
    USER_IGNORE_REQUEST = 'user.ignore-request',
}
