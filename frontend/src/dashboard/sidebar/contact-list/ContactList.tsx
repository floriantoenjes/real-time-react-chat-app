import { useContext } from "react";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useOnlineStatus } from "../../../shared/contexts/OnlineStatusContext";
import { IgnoredUsersContext } from "../../../shared/contexts/IgnoredUsersContext";
import { Contact } from "../../../shared/components/Contact";
import { Message } from "@t/message.contract";
import { useLastContactMessageCache } from "../../../shared/hooks/useLastContactMessageCache";
import { useI18nContext } from "../../../i18n/i18n-react";
import { DEMO_MODE } from "../../../environment";

export function ContactList(props: { nameFilter?: string }) {
    const { LL } = useI18nContext();
    const contactsContext = useContext(ContactsContext);
    const ignoredUsersContext = useContext(IgnoredUsersContext);
    const [selectedContact, setSelectedContact] =
        contactsContext.selectedContact;
    const [userContacts] = contactsContext.contacts;
    const [userContactGroups] = contactsContext.contactGroups;
    const [ignoredUserIds] = ignoredUsersContext.ignoredUserIds;
    const { contactsOnlineStatus } = useOnlineStatus();

    const { loaded, lastMessageCache } = useLastContactMessageCache();

    function sortByLastMessageDateTime(
        uc1Message?: Message,
        uc2Message?: Message,
    ) {
        if (uc1Message && uc2Message) {
            // Newest first. Compare timestamps, not Date strings: those start with the
            // weekday and drop the milliseconds.
            return (
                new Date(uc2Message.at).getTime() -
                new Date(uc1Message.at).getTime()
            );
        }

        return 0;
    }

    const contactElements = userContacts
        .concat(userContactGroups)
        .filter((contact) => {
            // Filter out ignored users
            if (ignoredUserIds.includes(contact._id)) {
                return false;
            }
            if (props.nameFilter === undefined) {
                return true;
            }

            return contact.name
                .toLowerCase()
                .match(props.nameFilter.toLowerCase());
        })
        .sort((uc1, uc2) => {
            const uc1LastMessage = uc1.lastMessage;
            const uc2LastMessage = uc2.lastMessage;

            if (!uc1LastMessage || !uc2LastMessage) {
                if (!uc1LastMessage) {
                    return 1;
                }
                if (!uc2LastMessage) {
                    return -1;
                }
            }

            return sortByLastMessageDateTime(
                lastMessageCache.get(uc1LastMessage),
                lastMessageCache.get(uc2LastMessage),
            );
        })
        .map((contact) => {
            return (
                <Contact
                    key={contact._id}
                    contact={contact}
                    selectedContact={selectedContact}
                    onContactSelect={() => setSelectedContact(contact)}
                    isOnline={contactsOnlineStatus.get(contact._id)}
                    lastMessage={
                        contact.lastMessage
                            ? lastMessageCache.get(contact.lastMessage)
                            : undefined
                    }
                />
            );
        });

    const showDemoHint =
        DEMO_MODE &&
        loaded &&
        userContacts.length === 0 &&
        userContactGroups.length === 0;

    return (
        <div>
            {loaded && contactElements}
            {showDemoHint && (
                <p className={"text-sm text-gray-500 p-4"}>
                    {LL.DEMO_EMPTY_CONTACTS()}
                </p>
            )}
        </div>
    );
}
