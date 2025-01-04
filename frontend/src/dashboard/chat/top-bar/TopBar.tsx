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

export function TopBar() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [user] = useUserContext();
    const [contacts, setContacts] = useContext(ContactsContext).contacts;
    const [contactGroups, setContactGroups] =
        useContext(ContactsContext).contactGroups;
    const [selectedContact, setSelectedContact] =
        useContext(ContactsContext).selectedContact;
    const [contactsOnlineStatus] =
        useContext(ContactsContext).contactsOnlineStatus;
    const [, setMessages] = useContext(MessageContext);

    const contactService = useDiContext().ContactService;
    const loggingService = useDiContext().LoggingService;
    const messageService = useDiContext().MessageService;

    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [socket] = useContext(SocketContext);

    const open = Boolean(anchorEl);
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const {
        setDataConnection,
        setCallingStream,
        setCalling,
        peer,
        setCall,
        setStream,
    } = useContext(PeerContext);

    useEffect(() => {
        if (socket) {
            socket.on("typing", (contactId: string) => {
                if (contactId === selectedContact?._id) {
                    setIsTyping(true);
                    setTimeout(() => {
                        setIsTyping(false);
                    }, 5000);
                }
            });
        }
    }, [socket]);

    function emptyChat() {
        if (!selectedContact) {
            return;
        }

        messageService
            .deleteMessages(user._id, selectedContact._id)
            .then(() => {
                snackbarService.showSnackbar(
                    "Chat messages have been deleted",
                    SnackbarLevels.SUCCESS,
                );
                setMessages([]);
                handleClose();
            })
            .catch(() => {
                snackbarService.showSnackbar(
                    "Chat messages could not be deleted",
                    SnackbarLevels.ERROR,
                );
            });
    }

    async function deleteChat() {
        if (!selectedContact) {
            return;
        }

        try {
            await messageService.deleteMessages(user._id, selectedContact._id);
        } catch (error) {
            snackbarService.showSnackbar(
                "Chat messages could not be deleted",
                SnackbarLevels.ERROR,
            );
            return;
        }

        const deletionRes = await contactService.deleteContact(
            user._id,
            selectedContact._id,
        );

        if (deletionRes.status !== 204) {
            snackbarService.showSnackbar(
                "Error deleting contact",
                SnackbarLevels.ERROR,
            );
            return;
        }

        setContacts(
            contacts.filter((cs: Contact) => cs._id !== selectedContact?._id),
        );
        setContactGroups(
            contactGroups.filter((cg) => cg._id !== selectedContact._id),
        );

        setSelectedContact(undefined);

        snackbarService.showSnackbar(
            `${selectedContact.name} is no longer a contact`,
            SnackbarLevels.SUCCESS,
        );
    }

    const [, setAnchorElDrawer] = useState<null | HTMLElement>(null);

    const [state, setState] = useState({
        top: false,
        left: false,
        bottom: false,
        right: false,
    });

    const handleCloseDrawer = () => {
        setAnchorElDrawer(null);
    };

    const toggleDrawer =
        (anchor: string, open: boolean, section?: string) =>
        (event: React.KeyboardEvent | React.MouseEvent) => {
            handleCloseDrawer();
            if (
                event?.type === "keydown" &&
                ((event as React.KeyboardEvent).key === "Tab" ||
                    (event as React.KeyboardEvent).key === "Shift")
            ) {
                return;
            }

            setState({ ...state, [anchor]: open });
        };

    async function startCall(video: boolean) {
        if (!selectedContact) {
            return;
        }

        setCalling(true);

        navigator.mediaDevices
            .getUserMedia({ video, audio: true })
            .then(async (stream) => {
                setCallingStream(stream);

                if (!peer) {
                    return;
                }

                const connection = peer.connect(selectedContact.name);
                setDataConnection(connection);

                connection.on("open", () => {
                    const call = peer.call(selectedContact?.name, stream);
                    setCall(call);
                    call.on("stream", (remoteStream) => {
                        // Show stream in some <video> element.
                        setStream(remoteStream);
                    });

                    call.on("close", () => {
                        setCall(null);
                        stream.getTracks().forEach((track) => {
                            track.stop();
                        });
                        setCalling(false);
                    });

                    connection.on("close", () => {
                        setCall(null);
                        stream.getTracks().forEach((track) => {
                            track.stop();
                        });
                        setCalling(false);
                    });
                });
            })
            .catch((reason) =>
                loggingService.error(reason, undefined, reason?.stack),
            );
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
            <div
                className={"flex items-center"}
                onClick={toggleDrawer("right", true)}
            >
                <Avatar
                    user={selectedContact ?? user}
                    isOnline={contactsOnlineStatus.get(
                        selectedContact?._id ?? "",
                    )}
                />
                <div>
                    <p>{selectedContact?.name}</p>
                    <Fade in={isTyping}>
                        <p className={"text-xs absolute"}>is typing...</p>
                    </Fade>
                </div>
            </div>
            <div className={"flex"}>
                <IconButton
                    className={"mr-3"}
                    disabled={
                        !contactsOnlineStatus.get(selectedContact?._id ?? "")
                    }
                    onClick={() => startCall(true)}
                >
                    <VideoCameraIcon className={"w-6"} />
                </IconButton>
                <IconButton
                    className={"mr-3"}
                    disabled={
                        !contactsOnlineStatus.get(selectedContact?._id ?? "")
                    }
                    onClick={() => startCall(false)}
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
                    <MenuItem onClick={emptyChat}>Chat leeren</MenuItem>
                    <MenuItem onClick={deleteChat}>Chat löschen</MenuItem>
                </Menu>
            </div>
            {selectedContact && (
                <Drawer
                    anchor={"right"}
                    open={state["right"]}
                    onClose={toggleDrawer("right", false)}
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
                                <IconButton
                                    onClick={toggleDrawer("right", false)}
                                >
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
