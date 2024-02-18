import { Link } from "react-router-dom";
import {
    Autocomplete,
    Button,
    Drawer,
    Fab,
    IconButton,
    Menu,
    MenuItem,
    TextField,
} from "@mui/material";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import React, { useContext, useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import "./TopSection.css";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { Contact } from "../../../shared/Contact";
import { Contact as ContactModel } from "real-time-chat-backend/shared/contact.contract";
import { useUserContext } from "../../../shared/contexts/UserContext";

export function TopSection() {
    const contactsContext = useContext(ContactsContext);
    const [contacts] = contactsContext.contacts;
    const [, setContactGroups] = contactsContext.contactGroups;
    const contactGroupService = contactsContext.contactGroupService;
    const [user] = useUserContext();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const [state, setState] = useState({
        top: false,
        left: false,
        bottom: false,
        right: false,
    });

    const [potentialGroupMembers, setPotentialGroupMembers] =
        useState(contacts);

    useEffect(() => {
        setPotentialGroupMembers(contacts);
    }, [contacts]);

    const toggleDrawer =
        (anchor: string, open: boolean) =>
        (event: React.KeyboardEvent | React.MouseEvent) => {
            handleClose();
            if (
                event?.type === "keydown" &&
                ((event as React.KeyboardEvent).key === "Tab" ||
                    (event as React.KeyboardEvent).key === "Shift")
            ) {
                return;
            }

            setState({ ...state, [anchor]: open });
        };

    const [groupMembers, setGroupMembers] = useState<string[]>([]);

    function addGroupMember(contact: ContactModel) {
        if (groupMembers.find((c) => c === contact.name)) {
            return;
        }

        setPotentialGroupMembers((prevState) =>
            prevState.filter((pgm) => pgm !== contact),
        );
        setGroupMembers((prevState) => [...prevState, contact.name].sort());
    }

    function onChangeMembers(evt: any, value: string[]) {
        setPotentialGroupMembers(() =>
            contacts.filter((c) => !value.includes(c.name)),
        );
        setGroupMembers([...new Set<string>(value.sort())]);
    }

    function createGroup() {
        const mappedMembers = groupMembers
            .map((gm) => contacts.find((c) => c.name === gm))
            .map((mm) => {
                if (!mm?._id) {
                    throw new Error("Group member without user id!");
                }
                return mm;
            });

        if (!mappedMembers) {
            return;
        }

        contactGroupService
            .addContactGroup(
                user._id,
                mappedMembers
                    .map((mm) => mm.name)
                    .reduce(
                        (previousValue, currentValue) =>
                            previousValue + ", " + currentValue,
                    ),
                mappedMembers.map((mm) => mm._id),
            )
            .then((res) => {
                toggleDrawer("left", false)({} as React.KeyboardEvent);
                if (res.status === 201) {
                    setContactGroups((prevState) => [...prevState, res.body]);
                }
            });
    }

    return (
        <div className={"flex items-center"}>
            <Link to="/" onClick={() => sessionStorage.removeItem("signedIn")}>
                <Button variant={"contained"}>Sign out</Button>
            </Link>
            <div className={"block ml-auto mr-2"}>
                <IconButton onClick={handleClick}>
                    <ChevronDownIcon className={"w-8"} />
                </IconButton>
                <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                    <MenuItem onClick={toggleDrawer("left", true)}>
                        New group
                    </MenuItem>
                </Menu>
            </div>
            <Drawer
                anchor={"left"}
                open={state["left"]}
                onClose={toggleDrawer("left", false)}
            >
                <div className={"drawer h-full"}>
                    <div className={"drawer-head"}>
                        <div
                            className={"flex justify-center items-center py-5"}
                        >
                            <IconButton onClick={toggleDrawer("left", false)}>
                                <ArrowLeftIcon className={"w-8"} />
                            </IconButton>
                            <h4 className={"ml-3"}>
                                Gruppenmitglieder hinzufügen
                            </h4>
                        </div>
                        <Autocomplete
                            multiple
                            id="tags-readOnly"
                            options={contacts.map((c) => c.name)}
                            renderInput={(params) => (
                                <TextField {...params} label="Members" />
                            )}
                            onChange={onChangeMembers}
                            value={groupMembers}
                            className={"p-3"}
                        />
                    </div>
                    <div
                        className={
                            "flex flex-col justify-between items-center h-3/4"
                        }
                    >
                        <div className={"w-full"}>
                            {potentialGroupMembers.map((c) => (
                                <span
                                    key={c.name}
                                    onClick={() => addGroupMember(c)}
                                >
                                    <Contact contact={c} />
                                </span>
                            ))}
                        </div>
                        {groupMembers.length > 0 && (
                            <Fab
                                className={"mt-auto mb-5"}
                                onClick={createGroup}
                            >
                                <ArrowRightIcon className={"w-8"} />
                            </Fab>
                        )}
                    </div>
                </div>
            </Drawer>
        </div>
    );
}
