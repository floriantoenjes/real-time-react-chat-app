import { Autocomplete, Fab, IconButton, TextField } from "@mui/material";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import React, { useContext } from "react";
import { ContactsContext } from "../../../../shared/contexts/ContactsContext";
import { Contact } from "../../../../shared/Contact";
import { User } from "@t/user.contract";
import { useI18nContext } from "../../../../i18n/i18n-react";
import { useContactGroupActions } from "../../../../shared/hooks/useContactGroupActions";

export function GroupCreation(props: { user: User; toggleDrawer: any }) {
    const contactsContext = useContext(ContactsContext);
    const [contacts] = contactsContext.contacts;

    const { LL } = useI18nContext();

    const {
        groupMembers,
        potentialGroupMembers,
        createGroup,
        addGroupMember,
        onChangeMembers,
    } = useContactGroupActions();

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
                        onClick={() =>
                            createGroup(() => {
                                props.toggleDrawer(
                                    "left",
                                    false,
                                )({} as React.KeyboardEvent);
                            })
                        }
                    >
                        <ArrowRightIcon className={"w-8"} />
                    </Fab>
                )}
            </div>
        </div>
    );
}
