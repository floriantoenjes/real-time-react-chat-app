import { Button, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import {
    ArrowDownOnSquareIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Avatar } from "../../shared/Avatar";
import { useContext, useState } from "react";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { useHandleInputChange } from "../../helpers";
import { useUserContext } from "../../shared/contexts/UserContext";

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
            <div
                key={Math.random() * 1_000_000}
                className={
                    "contact flex border p-2 cursor-pointer" +
                    (selectedContact === c ? " active" : "")
                }
                onClick={() => setSelectedContact(c)}
            >
                <Avatar width={"3.4rem"} height={"2.8rem"} />
                <div className={"flex-col w-full"}>
                    <div className={"flex justify-between"}>
                        <div>{c.username}</div>
                        <div>{c.lastMessage?.at?.toString()}</div>
                    </div>
                    <div>{c.lastMessage?.message}</div>
                </div>
            </div>
        ));
    }

    async function addContact() {
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
                    onBlur={addContact}
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
