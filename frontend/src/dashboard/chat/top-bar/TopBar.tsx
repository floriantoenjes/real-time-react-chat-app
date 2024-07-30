import { Avatar } from "../../../shared/Avatar";
import {
    ChevronDownIcon,
    MagnifyingGlassIcon,
    PhoneIcon,
    VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { Drawer, IconButton, Menu, MenuItem } from "@mui/material";
import React, {
    Dispatch,
    MouseEvent,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from "react";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { MessageContext } from "../../../shared/contexts/MessageContext";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { useDiContext } from "../../../shared/contexts/DiContext";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { PeerContext } from "../../../shared/contexts/PeerContext";

export function TopBar(props: {
    stream: MediaStream | null;
    setStream: Dispatch<SetStateAction<MediaStream | null>>;
}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [user] = useUserContext();
    const [contacts, setContacts] = useContext(ContactsContext).contacts;
    const [contactGroups, setContactGroups] =
        useContext(ContactsContext).contactGroups;
    const [selectedContact, setSelectedContact] =
        useContext(ContactsContext).selectedContact;
    const [, setMessages] = useContext(MessageContext);
    const contactService = useDiContext().ContactService;
    const messageService = useDiContext().MessageService;

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

    const [peer, setPeer] = useContext(PeerContext);

    async function startVideoCall() {
        if (!selectedContact) {
            return;
        }

        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then(async (stream) => {
                console.log(peer, selectedContact.name);

                if (!peer) {
                    return;
                }

                const call = peer.call(selectedContact?.name, stream);
                call.on("stream", (remoteStream) => {
                    // Show stream in some <video> element.
                    props.setStream(remoteStream);
                });
            })
            .catch((reason) => console.log(reason));
    }

    useEffect(() => {
        if (!peer) {
            return;
        }
        peer.on("call", (call) => {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .then(
                    (stream) => {
                        call.answer(stream); // Answer the call with an A/V stream.
                        call.on("stream", (remoteStream) => {
                            props.setStream(remoteStream);
                        });
                    },
                    (err) => {
                        console.error("Failed to get local stream", err);
                    },
                );
        });
    }, [peer]);

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
                <Avatar user={selectedContact ?? user} />
                <p>{selectedContact?.name}</p>
            </div>
            <div className={"flex"}>
                <IconButton className={"mr-3"}>
                    <VideoCameraIcon
                        className={"w-6"}
                        onClick={() => startVideoCall()}
                    />
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
