import { Avatar } from "../../../shared/components/Avatar";
import {
    ChevronDownIcon,
    PhoneIcon,
    VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { Drawer, Fade, IconButton, Menu, MenuItem } from "@mui/material";
import React, { useContext, useState } from "react";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useOnlineStatus } from "../../../shared/contexts/OnlineStatusContext";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { PeerContext } from "../../../shared/contexts/PeerContext";
import { useI18nContext } from "../../../i18n/i18n-react";
import { Contact } from "real-time-chat-backend/shared/contact.contract";
import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { useTypingIndicator } from "../../../shared/hooks/useTypingIndicator";
import { useContactActions } from "../../../shared/hooks/useContactActions";
import { useTopBarUI } from "../../../shared/hooks/useTopBarUI";
import { ContactGroup, isContactGroup } from "@t/contact-group.contract";
import { useDiContext } from "../../../shared/contexts/DiContext";
import { IgnoreConfirmationDialog } from "../../../shared/components/IgnoreConfirmationDialog";
import {
    SnackbarLevels,
    snackbarService,
} from "../../../shared/contexts/SnackbarContext";

export function TopBar(props: { selectedContact: Contact | ContactGroup }) {
    const { LL } = useI18nContext();
    const [user] = useUserContext();
    const [userContext] = useUserContext();
    const { contactsOnlineStatus } = useOnlineStatus();
    const { startCall } = useContext(PeerContext);
    const [, setSelectedContact] = useContext(ContactsContext).selectedContact;
    const ignoredUserService = useDiContext().IgnoredUserService;

    const selectedContact = props.selectedContact;

    const { isTyping } = useTypingIndicator(selectedContact._id);
    const { emptyChat, deleteChat, leaveGroup } = useContactActions();
    const { anchorEl, open, state, handleClick, handleClose, toggleDrawer } =
        useTopBarUI();
    const [ignoreDialogOpen, setIgnoreDialogOpen] = useState(false);

    return (
        <div
            className={
                "flex items-center border border-blue-100 w-full p-2 justify-between sticky top-0 bg-white cursor-pointer z-10"
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
                        <p className={"text-xs absolute"}>{LL.IS_TYPING()}</p>
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
                {/*<IconButton> TODO: Implement later*/}
                {/*    <MagnifyingGlassIcon className={"w-6"} />*/}
                {/*</IconButton>*/}
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
                    slotProps={{
                        list: { "aria-labelledby": "basic-button" },
                    }}
                >
                    <MenuItem
                        onClick={() => emptyChat(selectedContact, handleClose)}
                    >
                        {LL.EMPTY_CHAT()}
                    </MenuItem>
                    {isContactGroup(selectedContact) ? (
                        <MenuItem
                            onClick={() =>
                                leaveGroup(selectedContact, handleClose)
                            }
                        >
                            {LL.LEAVE_GROUP()}
                        </MenuItem>
                    ) : (
                        <span>
                            <MenuItem
                                onClick={() =>
                                    deleteChat(selectedContact, handleClose)
                                }
                            >
                                {LL.DELETE_CHAT()}
                            </MenuItem>
                            {selectedContact._id !== userContext._id && (
                                <MenuItem
                                    onClick={() => {
                                        handleClose();
                                        setIgnoreDialogOpen(true);
                                    }}
                                >
                                    {LL.IGNORE()}
                                </MenuItem>
                            )}
                        </span>
                    )}
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

            <IgnoreConfirmationDialog
                open={ignoreDialogOpen}
                onClose={() => setIgnoreDialogOpen(false)}
                onConfirm={async () => {
                    if (!isContactGroup(selectedContact)) {
                        await ignoredUserService.ignoreUser(
                            selectedContact._id,
                        );
                        setSelectedContact(undefined);
                        snackbarService.showSnackbar(
                            LL.IGNORE_USER_SUCCESS({
                                contactName: selectedContact.name,
                            }),
                            SnackbarLevels.SUCCESS,
                        );
                    }
                }}
                contactName={selectedContact.name}
            />
        </div>
    );
}
