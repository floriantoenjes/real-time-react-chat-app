import { useContext } from "react";
import { ContactsContext } from "../contexts/ContactsContext";
import { MessageContext } from "../contexts/MessageContext";
import { useDiContext } from "../contexts/DiContext";
import { SnackbarLevels, snackbarService } from "../contexts/SnackbarContext";
import { useI18nContext } from "../../i18n/i18n-react";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { ContactGroup } from "@t/contact-group.contract";

/**
 * Custom hook for contact-related actions (delete, leave group, etc.)
 * @returns Object containing contact action functions
 */
export function useContactActions() {
    const { LL } = useI18nContext();
    const [contacts, setContacts] = useContext(ContactsContext).contacts;
    const [contactGroups, setContactGroups] =
        useContext(ContactsContext).contactGroups;
    const [, setSelectedContact] = useContext(ContactsContext).selectedContact;
    const [, setMessages] = useContext(MessageContext);

    const {
        ContactService: contactService,
        ContactGroupService: contactGroupService,
        MessageService: messageService,
    } = useDiContext();

    async function emptyChat(
        selectedContact: Contact | ContactGroup,
        callback?: () => void,
    ) {
        const result = await messageService.deleteMessages(selectedContact._id);
        if (result === false) {
            snackbarService.showSnackbar(
                LL.ERROR.COULD_NOT_DELETE_CHAT_MESSAGES(),
                SnackbarLevels.ERROR,
            );
            return false;
        }
        snackbarService.showSnackbar(
            LL.CHAT_MESSAGES_DELETED(),
            SnackbarLevels.SUCCESS,
        );
        setMessages([]);
        callback?.();
        return true;
    }

    async function deleteChatMessages(selectedContact: Contact | ContactGroup) {
        await messageService.deleteMessages(selectedContact._id);
    }

    async function deleteChatContact(selectedContact: Contact | ContactGroup) {
        const contactIsAGroup = "memberIds" in selectedContact;
        if (contactIsAGroup) {
            const deletionResult =
                await contactGroupService.deleteContactGroup(selectedContact);
            if (deletionResult) {
                return true;
            }
        } else {
            const deletionRes =
                await contactService.deleteContact(selectedContact);

            if (deletionRes.status !== 204) {
                return false;
            }
        }

        setContacts(
            contacts.filter((cs: Contact) => cs._id !== selectedContact._id),
        );
        setContactGroups(
            contactGroups.filter((cg) => cg._id !== selectedContact._id),
        );
        setSelectedContact(undefined);

        snackbarService.showSnackbar(
            LL.CONTACT_REMOVED({ name: selectedContact.name }),
            SnackbarLevels.SUCCESS,
        );
        return true;
    }

    async function deleteChat(
        selectedContact: Contact | ContactGroup,
        callback?: () => void,
    ) {
        await deleteChatMessages(selectedContact);
        await deleteChatContact(selectedContact);
        callback?.();
    }

    async function leaveGroup(
        selectedContact: Contact | ContactGroup,
        callback?: () => void,
    ) {
        if (!("memberIds" in selectedContact)) {
            return false;
        }

        const leaveResult = await contactGroupService.leaveContactGroup(
            selectedContact._id,
        );

        if (!leaveResult) {
            snackbarService.showSnackbar(
                LL.ERROR.COULD_NOT_LEAVE_GROUP(),
                SnackbarLevels.ERROR,
            );
            return false;
        }

        setContactGroups(
            contactGroups.filter((cg) => cg._id !== selectedContact._id),
        );
        setSelectedContact(undefined);

        snackbarService.showSnackbar(
            LL.GROUP_LEFT({ name: selectedContact.name }),
            SnackbarLevels.SUCCESS,
        );

        callback?.();
        return true;
    }

    return {
        emptyChat,
        deleteChat,
        leaveGroup,
        deleteChatMessages,
        deleteChatContact,
    };
}
