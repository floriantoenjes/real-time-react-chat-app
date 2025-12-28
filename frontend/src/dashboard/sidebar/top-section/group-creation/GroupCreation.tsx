import { Autocomplete, Fab, IconButton, TextField } from "@mui/material";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import React, { useContext, useEffect, useState } from "react";
import { Contact as ContactModel } from "@t/contact.contract";
import { ContactsContext } from "../../../../shared/contexts/ContactsContext";
import { Contact } from "../../../../shared/Contact";
import { User } from "@t/user.contract";
import { useDiContext } from "../../../../shared/contexts/DiContext";
import { useI18nContext } from "../../../../i18n/i18n-react";

export function GroupCreation(props: { user: User; toggleDrawer: any }) {
    const contactsContext = useContext(ContactsContext);
    const [contacts] = contactsContext.contacts;
    const [, setContactGroups] = contactsContext.contactGroups;
    const contactGroupService = useDiContext().ContactGroupService;
    const { LL } = useI18nContext();

    const [groupMembers, setGroupMembers] = useState<string[]>([]);

    const [potentialGroupMembers, setPotentialGroupMembers] =
        useState(contacts);

    useEffect(() => {
        setPotentialGroupMembers(contacts);
    }, [contacts]);

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
                props.user._id,
                mappedMembers
                    .map((mm) => mm.name)
                    .reduce(
                        (previousValue, currentValue) =>
                            previousValue + ", " + currentValue,
                    ),
                mappedMembers.map((mm) => mm._id),
            )
            .then((result) => {
                props.toggleDrawer("left", false)({} as React.KeyboardEvent);
                if (result) {
                    setContactGroups((prevState) => [...prevState, result]);
                }
            });
    }

    return (
        <div className={"drawer h-full"}>
            <div className={"drawer-head"}>
                <div className={"flex justify-center items-center py-5"}>
                    <IconButton onClick={props.toggleDrawer("left", false)}>
                        <ArrowLeftIcon className={"w-8"} />
                    </IconButton>
                    <h4 className={"ml-3"}>{LL.ADD_GROUP_MEMBERS()}</h4>
                </div>
                <Autocomplete
                    multiple
                    id="group-members-input"
                    options={contacts.map((c) => c.name)}
                    renderInput={(params) => (
                        <TextField {...params} label={LL.MEMBERS()} />
                    )}
                    onChange={onChangeMembers}
                    value={groupMembers}
                    className={"p-3"}
                />
            </div>
            <div className={"flex flex-col justify-between items-center h-2/3"}>
                <div className={"w-full"}>
                    {potentialGroupMembers.map((c) => (
                        <span key={c.name} onClick={() => addGroupMember(c)}>
                            <Contact contact={c} />
                        </span>
                    ))}
                </div>
                {groupMembers.length > 0 && (
                    <Fab
                        name={"create-group-button"}
                        className={"mt-auto mb-5"}
                        onClick={createGroup}
                    >
                        <ArrowRightIcon className={"w-8"} />
                    </Fab>
                )}
            </div>
        </div>
    );
}
