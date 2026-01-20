import { Avatar } from "../../../shared/Avatar";
import {
    ChevronDownIcon,
    MagnifyingGlassIcon,
    PhoneIcon,
    VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { Drawer, Fade, IconButton, Menu, MenuItem } from "@mui/material";
import React, { MouseEvent, useContext, useEffect, useState } from "react";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useOnlineStatus } from "../../../shared/contexts/OnlineStatusContext";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { MessageContext } from "../../../shared/contexts/MessageContext";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { useDiContext } from "../../../shared/contexts/DiContext";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { PeerContext } from "../../../shared/contexts/PeerContext";
import { SocketContext } from "../../../shared/contexts/SocketContext";
import {
    SnackbarLevels,
    snackbarService,
} from "../../../shared/contexts/SnackbarContext";
import { useI18nContext } from "../../../i18n/i18n-react";
import { SocketMessageTypes } from "@t/socket-message-types.enum";
import { ContactGroup } from "@t/contact-group.contract";

export function TopBar(props: { selectedContact: Contact | ContactGroup }) {
    const { LL } = useI18nContext();
    const [user] = useUserContext();
    const [contacts, setContacts] = useContext(ContactsContext).contacts;
    const [contactGroups, setContactGroups] =
        useContext(ContactsContext).contactGroups;
    const selectedContact = props.selectedContact;
    const [, setSelectedContact] = useContext(ContactsContext).selectedContact;
    const { contactsOnlineStatus } = useOnlineStatus();
    const [, setMessages] = useContext(MessageContext);
    const { startCall } = useContext(PeerContext);
    const [socket] = useContext(SocketContext);

    const {
        ContactService: contactService,
        ContactGroupService: contactGroupService,
        MessageService: messageService,
    } = useDiContext();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [, setAnchorElDrawer] = useState<null | HTMLElement>(null);
    const [state, setState] = useState(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.on(
            SocketMessageTypes.typing,
            (body: { userId: string; isTyping: boolean }) => {
                if (body.userId === selectedContact._id) {
                    setIsTyping(body.isTyping);
                    setTimeout(() => {
                        setIsTyping(false);
                    }, 5000);
                }
            },
        );
    }, [socket]);

    function emptyChat() {
        messageService
            .deleteMessages(selectedContact._id)
            .then(() => {
                snackbarService.showSnackbar(
                    LL.CHAT_MESSAGES_DELETED(),
                    SnackbarLevels.SUCCESS,
                );
                setMessages([]);
                handleClose();
            })
            .catch();
    }

    async function deleteChat() {
        deleteChatMessages(selectedContact).then(() =>
            deleteChatContact(selectedContact),
        );
    }

    async function deleteChatMessages(selectedContact: Contact | ContactGroup) {
        await messageService.deleteMessages(selectedContact._id);
    }

    async function deleteChatContact(selectedContact: Contact | ContactGroup) {
        const isAContactGroup = "memberIds" in selectedContact;
        if (isAContactGroup) {
            const deletionResult =
                await contactGroupService.deleteContactGroup(selectedContact);
            if (deletionResult) {
                return;
            }
        } else {
            const deletionRes =
                await contactService.deleteContact(selectedContact);

            if (deletionRes.status !== 204) {
                return;
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
    }

    const handleCloseDrawer = () => {
        setAnchorElDrawer(null);
    };

    const toggleDrawer =
        (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
            handleCloseDrawer();
            if (
                event?.type === "keydown" &&
                ((event as React.KeyboardEvent).key === "Tab" ||
                    (event as React.KeyboardEvent).key === "Shift")
            ) {
                return;
            }

            setState(open);
        };

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

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
            <div className={"flex items-center"} onClick={toggleDrawer(true)}>
                <Avatar
                    user={selectedContact ?? user}
                    isOnline={contactsOnlineStatus.get(
                        selectedContact._id ?? "",
                    )}
                />
                <div>
                    <p>{selectedContact.name}</p>
                    <Fade in={isTyping}>
                        <p className={"text-xs absolute"}>is typing...</p>
                    </Fade>
                </div>
            </div>
            <div className={"flex"}>
                <IconButton
                    className={"mr-3"}
                    disabled={
                        !contactsOnlineStatus.get(selectedContact._id ?? "")
                    }
                    onClick={() => startCall(selectedContact, true)}
                >
                    <VideoCameraIcon className={"w-6"} />
                </IconButton>
                <IconButton
                    className={"mr-3"}
                    disabled={
                        !contactsOnlineStatus.get(selectedContact._id ?? "")
                    }
                    onClick={() => startCall(selectedContact, false)}
                >
                    <PhoneIcon className={"w-6"} />
                </IconButton>
                <IconButton>
                    <MagnifyingGlassIcon className={"w-6"} />
                </IconButton>
                <IconButton
                    id="basic-button"
                    name="chat-menu-button"
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
                    <MenuItem onClick={emptyChat}>{LL.EMPTY_CHAT()}</MenuItem>
                    <MenuItem onClick={deleteChat}>{LL.DELETE_CHAT()}</MenuItem>
                </Menu>
            </div>
            {selectedContact && (
                <Drawer
                    anchor={"right"}
                    open={state}
                    onClose={toggleDrawer(false)}
                >
                    <div className={"drawer h-full"}>
                        <div className={"drawer-head"}>
                            <div
                                className={
                                    "flex justify-center items-center py-5 "
                                }
                            >
                                <h4 className={"ml-3"}>
                                    {selectedContact.name}
                                </h4>
                                <IconButton onClick={toggleDrawer(false)}>
                                    <ArrowRightIcon className={"w-8"} />
                                </IconButton>
                            </div>
                        </div>
                        <div
                            className={
                                "flex flex-col justify-between items-center h-3/4"
                            }
                        >
                            <div
                                className={
                                    "mt-3 avatar bg-blue-400 w-48 h-48 relative cursor-pointer rounded-xl"
                                }
                            >
                                <Avatar
                                    user={selectedContact}
                                    width={"12rem"}
                                    height={"12rem"}
                                    squared={true}
                                />
                            </div>
                        </div>
                    </div>
                </Drawer>
            )}
        </div>
    );
}
