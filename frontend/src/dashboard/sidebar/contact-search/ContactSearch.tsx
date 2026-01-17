import { Autocomplete, TextField } from "@mui/material";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useContext, useEffect, useState } from "react";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useHandleInputChange } from "../../../helpers";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { User } from "@t/user.contract";
import { useDiContext } from "../../../shared/contexts/DiContext";
import { useI18nContext } from "../../../i18n/i18n-react";
import {
    SnackbarLevels,
    snackbarService,
} from "../../../shared/contexts/SnackbarContext";

export function ContactSearch(props: {
    onFilterChange: (filter: string) => void;
}) {
    const { LL } = useI18nContext();
    const [user] = useUserContext();
    const { ContactService: contactService, UserService: userService } =
        useDiContext();
    const contactsContext = useContext(ContactsContext);
    const [userContacts, setUserContacts] = contactsContext.contacts;

    const [users, setUsers] = useState<User[]>([]);
    const [, setFormData] = useState({
        contactName: "",
    });
    const [autoCompleteKey, setAutoCompleteKey] = useState<string>("false");

    const handleInputChange = useHandleInputChange(setFormData);

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

        setFormData({ contactName: "" });
        setAutoCompleteKey((!JSON.parse(autoCompleteKey)).toString());
        props.onFilterChange("");
    }

    return (
        <div className={"flex"}>
            <Autocomplete
                options={users.map((u) => u.username)}
                getOptionLabel={(option) => option + ADD_CONTACT_MARK}
                onChange={(evt) => {
                    setFormData({
                        contactName: (evt.target as any).textValue,
                    });
                    void addContact(evt);
                }}
                onInputChange={(evt: any) => {
                    if (evt.target.textContent) {
                        props.onFilterChange(evt.target.textContent);
                        return;
                    }
                    props.onFilterChange(evt.target.value);
                }}
                className={"w-full"}
                freeSolo={true}
                key={autoCompleteKey}
                isOptionEqualToValue={(option, value) => option === value}
                renderInput={(params) => (
                    <TextField
                        name={"contactName"}
                        {...params}
                        onInput={handleInputChange}
                        onBlur={handleInputChange}
                        label={
                            <div>
                                <MagnifyingGlassIcon
                                    className={"w-4 inline mr-2"}
                                />
                                {LL.ADD_CONTACT()}
                            </div>
                        }
                    />
                )}
            />
        </div>
    );
}
