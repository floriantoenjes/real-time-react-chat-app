import { useContext, useEffect, useState } from "react";
import { ContactsContext } from "../contexts/ContactsContext";
import { useDiContext } from "../contexts/DiContext";
import { Contact as ContactModel } from "@t/contact.contract";

export function useContactGroupActions() {
    const contactsContext = useContext(ContactsContext);
    const [contacts] = contactsContext.contacts;
    const [, setContactGroups] = contactsContext.contactGroups;
    const contactGroupService = useDiContext().ContactGroupService;

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

    function createGroup(callBack: () => void) {
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
                mappedMembers
                    .map((mm) => mm.name)
                    .reduce(
                        (previousValue, currentValue) =>
                            previousValue + ", " + currentValue,
                    ),
                mappedMembers.map((mm) => mm._id),
            )
            .then((result) => {
                callBack();
                if (result) {
                    setContactGroups((prevState) => [...prevState, result]);
                }
            });
    }
    return {
        potentialGroupMembers,
        groupMembers,
        addGroupMember,
        onChangeMembers,
        createGroup,
    };
}
