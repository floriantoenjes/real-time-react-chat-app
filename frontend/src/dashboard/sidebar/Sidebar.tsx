import { Button, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import {
    ArrowDownOnSquareIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useContext, useState } from "react";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { checkEnterPressed, useHandleInputChange } from "../../helpers";
import { useUserContext } from "../../shared/contexts/UserContext";
import { Contact } from "../../shared/Contact";

export function Sidebar() {
    const [user, , userService] = useUserContext();

    const contactsContext = useContext(ContactsContext);
    const contactService = contactsContext.contactService;
    const [selectedContact, setSelectedContact] =
        contactsContext.selectedContact;
    const [userContacts, setUserContacts] = contactsContext.contacts;

    const [formData, setFormData] = useState({
        contactName: "",
    });

    const handleInputChange = useHandleInputChange(setFormData);

    function contactList() {
        return userContacts.map((c) => (
            <Contact
                contact={c}
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
            />
        ));
    }

    async function addContact(event: any) {
        if (!checkEnterPressed(event)) {
            return;
        }

        const searchedUser = await userService.searchForUserByUsername(
            formData.contactName,
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
    }

    return (
        <div className={"sidebar h-screen border"}>
            <div>
                <Link to="/">
                    <Button>Sign out</Button>
                </Link>
            </div>

            <div className={"flex"}>
                <TextField
                    className={"w-full"}
                    label={
                        <div>
                            <MagnifyingGlassIcon
                                className={"w-4 inline mr-2"}
                            />
                            Suchen oder neuen Chat beginnen
                        </div>
                    }
                    value={formData.contactName}
                    onChange={handleInputChange}
                    onKeyUp={addContact}
                    name={"contactName"}
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
