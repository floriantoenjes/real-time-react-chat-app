import { Button, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import {
    ArrowDownOnSquareIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Avatar } from "../../shared/Avatar";
import { useContext } from "react";
import { ContactsContext } from "../../shared/contexts/ContactsContext";

export function Sidebar() {
    const contactsContext = useContext(ContactsContext);
    const [userContacts] = contactsContext.contacts;
    const [selectedContact, setSelectedContact] =
        contactsContext.selectedContact;

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
                        <div>{c.name}</div>
                        <div>{c.time}</div>
                    </div>
                    <div>{c.lastMessage}</div>
                </div>
            </div>
        ));
    }

    return (
        <div className={"sidebar h-screen border"}>
            <div>
                <Button>
                    <Link to="/">Sign out</Link>
                </Button>
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
