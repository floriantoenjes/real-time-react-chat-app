import { Avatar } from "../../../shared/Avatar";
import {
    ChevronDownIcon,
    MagnifyingGlassIcon,
    PhoneIcon,
    VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { IconButton, Menu, MenuItem } from "@mui/material";
import {
    Dispatch,
    MouseEvent,
    SetStateAction,
    useContext,
    useState,
} from "react";
import { Contact } from "../../../shared/types/Contact";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";

export function TopBar(props: {
    setMessages: Dispatch<
        SetStateAction<{ from: string; at: Date; message: string }[]>
    >;
}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    function emptyChat() {
        props.setMessages([]);
        handleClose();
    }

    const [contacts, setContacts] = useContext(ContactsContext).contacts;
    const [selectedContact, setSelectedContact] =
        useContext(ContactsContext).selectedContact;

    function deleteChat() {
        setContacts(
            contacts.filter((cs: Contact) => cs.name !== selectedContact?.name),
        );
        setSelectedContact(undefined);
    }

    return (
        <div
            className={
                "flex items-center border w-full p-2 justify-between sticky top-0 bg-white"
            }
        >
            <div className={"flex items-center"}>
                <Avatar />
                <p>{selectedContact?.name}</p>
            </div>
            <div className={"flex"}>
                <IconButton className={"mr-3"}>
                    <VideoCameraIcon className={"w-6"} />
                </IconButton>
                <IconButton className={"mr-3"}>
                    <PhoneIcon className={"w-6"} />
                </IconButton>
                <IconButton>
                    <MagnifyingGlassIcon className={"w-6"} />
                </IconButton>
                <IconButton
                    id="basic-button"
                    aria-controls={open ? "basic-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                    onClick={handleClick}
                >
                    <ChevronDownIcon className={"w-8"} />
                </IconButton>
                <Menu
                    id="basic-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                        "aria-labelledby": "basic-button",
                    }}
                >
                    <MenuItem onClick={emptyChat}>Chat leeren</MenuItem>
                    <MenuItem onClick={deleteChat}>Chat löschen</MenuItem>
                </Menu>
            </div>
        </div>
    );
}
