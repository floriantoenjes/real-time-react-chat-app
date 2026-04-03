import { useContext, useEffect, useState } from "react";
import { User } from "@t/user.contract";
import { SnackbarLevels, snackbarService } from "../contexts/SnackbarContext";
import { useUserContext } from "../contexts/UserContext";
import { useDiContext } from "../contexts/DiContext";
import { ContactsContext } from "../contexts/ContactsContext";
import { useI18nContext } from "../../i18n/i18n-react";

export const useUserContacts = () => {
    const [user] = useUserContext();
    const [users, setUsers] = useState<User[]>([]);
    const { LL } = useI18nContext();
    const { ContactService: contactService, UserService: userService } =
        useDiContext();

    const contactsContext = useContext(ContactsContext);
    const [userContacts, setUserContacts] = contactsContext.contacts;

    const ADD_CONTACT_MARK = ` (${LL.ADD()})`;

    useEffect(() => {
        loadUserContacts();
    }, [userContacts]);

    function loadUserContacts() {
        userService.getUsers().then((users) => {
            if (!users) {
                return;
            }

            setUsers(
                users.filter(
                    (contact: User) =>
                        contact._id !== user._id &&
                        !userContacts.find((uc) => uc._id === contact._id),
                ),
            );
        });
    }

    async function addContact(evt: any) {
        const contactName = evt.target.textContent.replace(
            ADD_CONTACT_MARK,
            "",
        );

        if (!users.map((u) => u.username).includes(contactName ?? "")) {
            return;
        }

        const searchedUser =
            await userService.searchForUserByUsername(contactName);
        if (!searchedUser) {
            return;
        }
        const newContactResponse = await contactService.addContact(
            searchedUser._id,
        );
        if (newContactResponse.status !== 201) {
            return;
        }

        snackbarService.showSnackbar(
            LL.CONTACT_ADDED({ name: newContactResponse.body.name }),
            SnackbarLevels.SUCCESS,
        );

        setUserContacts((prevState) => {
            return [...prevState, newContactResponse.body];
        });
    }

    return { addContact, users, ADD_CONTACT_MARK };
};
