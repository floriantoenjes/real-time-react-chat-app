import { Autocomplete, Button, TextField } from "@mui/material";
import {
    ArrowDownOnSquareIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useContext, useEffect, useState } from "react";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { useHandleInputChange } from "../../helpers";
import { useUserContext } from "../../shared/contexts/UserContext";
import { Contact } from "../../shared/Contact";
import { TopSection } from "./top-section/TopSection";
import { User } from "@t/user.contract";

export function Sidebar() {
    const [user, , userService] = useUserContext();

    const contactsContext = useContext(ContactsContext);
    const contactService = contactsContext.contactService;
    const [selectedContact, setSelectedContact] =
        contactsContext.selectedContact;
    const [userContacts, setUserContacts] = contactsContext.contacts;
    const [userContactGroups, setUserContactGroups] =
        contactsContext.contactGroups;

    const [formData, setFormData] = useState({
        contactName: "",
    });

    const [users, setUsers] = useState<User[]>([]);

    const handleInputChange = useHandleInputChange(setFormData);

    const [autoCompleteKey, setAutoCompleteKey] = useState<boolean>(false);

    useEffect(() => {
        userService.getUsers().then((users) => {
            if (!users) {
                return;
            }

            setUsers(
                users.filter(
                    (u) =>
                        u._id !== user._id &&
                        !userContacts.find((uc) => uc._id === u._id),
                ),
            );
        });
    }, [userContacts]);

    function contactList() {
        return userContacts
            .concat(userContactGroups)
            .map((c) => (
                <Contact
                    key={c.name}
                    contact={c}
                    selectedContact={selectedContact}
                    onContactSelect={() => setSelectedContact(c)}
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
                        : evt.target.textContent ?? "",
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
        const newContactRes = await contactService.addContact(
            user._id,
            searchedUser._id,
        );
        if (newContactRes.status !== 201) {
            return;
        }

        setUserContacts((prevState) => {
            return [...prevState, newContactRes.body];
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
                    key={"" + autoCompleteKey}
                    className={"w-full"}
                    freeSolo={true}
                    isOptionEqualToValue={(option, value) => option === value}
                    renderInput={(params) => (
                        <TextField
                            name={"contactName"}
                            {...params}
                            onInput={handleInputChange}
                            label={
                                <div>
                                    <MagnifyingGlassIcon
                                        className={"w-4 inline mr-2"}
                                    />
                                    Suchen oder neuen Chat beginnen
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
                <div className={"border"}>
                    <Button
                        className={"text-start w-full"}
                        startIcon={<ArrowDownOnSquareIcon className={"h-8"} />}
                    >
                        Archiviert
                    </Button>
                </div>
                <div className={"border"}>{contactList()}</div>
            </div>
        </div>
    );
}
