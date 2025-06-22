import { Autocomplete, Button, TextField } from "@mui/material";
import {
    ArrowDownOnSquareIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useContext, useEffect, useState } from "react";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { checkEnterPressed, useHandleInputChange } from "../../helpers";
import { useUserContext } from "../../shared/contexts/UserContext";
import { Contact } from "../../shared/Contact";
import { TopSection } from "./top-section/TopSection";
import { User } from "@t/user.contract";
import { useDiContext } from "../../shared/contexts/DiContext";
import { useI18nContext } from "../../i18n/i18n-react";
import {
    SnackbarLevels,
    snackbarService,
} from "../../shared/contexts/SnackbarContext";

export function Sidebar() {
    const { LL } = useI18nContext();
    const [user, ,] = useUserContext();
    const userService = useDiContext().UserService;
    const contactsContext = useContext(ContactsContext);
    const contactService = useDiContext().ContactService;

    const [selectedContact, setSelectedContact] =
        contactsContext.selectedContact;
    const [userContacts, setUserContacts] = contactsContext.contacts;
    const [userContactsOnlineStatus] = contactsContext.contactsOnlineStatus;
    const [userContactGroups] = contactsContext.contactGroups;

    const [, setFormData] = useState({
        contactName: "",
    });

    const [users, setUsers] = useState<User[]>([]);

    const handleInputChange = useHandleInputChange(setFormData);

    const [autoCompleteKey, setAutoCompleteKey] = useState<boolean>(false);

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

    useEffect(() => {
        loadUserContacts();
    }, [userContacts]);

    function contactList() {
        return userContacts
            .concat(userContactGroups)
            .sort((uc1, uc2) => {
                const uc1MessageDate = uc1.lastMessage?.at;
                const uc2MessageDate = uc2.lastMessage?.at;

                if (uc1MessageDate && uc2MessageDate) {
                    return -uc1MessageDate
                        .toString()
                        .localeCompare(uc2MessageDate.toString());
                }

                return 0;
            })
            .map((c) => (
                <Contact
                    key={c.name}
                    contact={c}
                    selectedContact={selectedContact}
                    onContactSelect={() => setSelectedContact(c)}
                    isOnline={userContactsOnlineStatus.get(c._id)}
                />
            ));
    }

    async function addContact(evt: any) {
        if (
            !users
                .map((u) => u.username)
                .includes(
                    !!evt.target.value
                        ? evt.target.value
                        : (evt.target.textContent ?? ""),
                )
        ) {
            return;
        }

        const searchedUser = await userService.searchForUserByUsername(
            !!evt.target.value ? evt.target.value : evt.target.textContent,
        );
        if (!searchedUser) {
            return;
        }
        const newContactResponse = await contactService.addContact(
            user._id,
            searchedUser._id,
        );
        if (newContactResponse.status !== 201) {
            snackbarService.showSnackbar(
                LL.ERROR.COULD_NOT_ADD_CONTACT(),
                SnackbarLevels.ERROR,
            );
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
        setAutoCompleteKey(!autoCompleteKey);
    }

    return (
        <div
            className={
                "sidebar h-screen border" +
                (selectedContact ? " hidden md:block" : "")
            }
        >
            <TopSection />

            <div className={"flex"}>
                <Autocomplete
                    options={users.map((u) => u.username)}
                    onChange={(evt) => {
                        setFormData({
                            contactName: (evt.target as any).textValue,
                        });
                        void addContact(evt);
                    }}
                    onKeyUp={(evt) => {
                        if (!checkEnterPressed(evt)) {
                            return;
                        }

                        setFormData({
                            contactName: (evt.target as any).textValue,
                        });
                        void addContact(evt);
                    }}
                    className={"w-full"}
                    freeSolo={true}
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

                <div className={"border"}>
                    <Button className={"h-full"}>
                        <FunnelIcon className={"h-8"} />
                    </Button>
                </div>
            </div>
            <div className={"border"}>
                {/*<div className={"border"}>*/}
                {/*    <Button*/}
                {/*        className={"text-start w-full"}*/}
                {/*        startIcon={<ArrowDownOnSquareIcon className={"h-8"} />}*/}
                {/*    >*/}
                {/*        {LL.ARCHIVED()}*/}
                {/*    </Button>*/}
                {/*</div>*/}
                <div className={"border"}>{contactList()}</div>
            </div>
        </div>
    );
}
