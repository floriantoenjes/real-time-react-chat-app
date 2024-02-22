import { Avatar } from "../../../shared/Avatar";
import {
    ChevronDownIcon,
    MagnifyingGlassIcon,
    PhoneIcon,
    VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { MouseEvent, useContext, useState } from "react";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { MessageContext } from "../../../shared/contexts/MessageContext";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { ChevronLeftIcon } from "@heroicons/react/16/solid";

export function TopBar() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [user] = useUserContext();
    const [contacts, setContacts] = useContext(ContactsContext).contacts;
    const [contactGroups, setContactGroups] =
        useContext(ContactsContext).contactGroups;
    const [selectedContact, setSelectedContact] =
        useContext(ContactsContext).selectedContact;
    const [, setMessages, messageService] = useContext(MessageContext);
    const contactService = useContext(ContactsContext).contactService;

    const open = Boolean(anchorEl);
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    function emptyChat() {
        if (!selectedContact) {
            return;
        }

        messageService.deleteMessages(user._id, selectedContact._id);
        setMessages([]);
        handleClose();
    }

    async function deleteChat() {
        if (!selectedContact) {
            return;
        }

        messageService.deleteMessages(user._id, selectedContact._id);

        const deletionRes = await contactService.deleteContact(
            user._id,
            selectedContact._id,
        );

        if (deletionRes.status !== 204) {
            return;
        }

        setContacts(
            contacts.filter((cs: Contact) => cs._id !== selectedContact?._id),
        );
        setContactGroups(
            contactGroups.filter((cg) => cg._id !== selectedContact._id),
        );

        setSelectedContact(undefined);
    }

    return (
        <div
            className={
                "flex items-center border w-full p-2 justify-between sticky top-0 bg-white cursor-pointer"
            }
        >
            <div className={"sm:block md:hidden"}>
                <IconButton onClick={() => setSelectedContact(undefined)}>
                    <ChevronLeftIcon className={"w-8"} />
                </IconButton>
            </div>
            <div className={"flex items-center"}>
                <Avatar user={selectedContact ?? user} />
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
