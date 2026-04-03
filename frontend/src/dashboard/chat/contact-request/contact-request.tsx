import { useDiContext } from "../../../shared/contexts/DiContext";
import { Contact } from "@t/contact.contract";
import { ContactGroup } from "@t/contact-group.contract";
import { Button, Card, CardActions, CardContent } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import type { ContactRequest } from "@t/contact-request.contract";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import {
    SnackbarLevels,
    snackbarService,
} from "../../../shared/contexts/SnackbarContext";

interface ContactRequestProps {
    selectedContact?: Contact | ContactGroup;
}

export function ContactRequest({ selectedContact }: ContactRequestProps) {
    const contactRequestService = useDiContext().ContactRequestService;
    const [contactRequest, setContactRequest] = useState<ContactRequest>();
    const [, setContacts] = useContext(ContactsContext).contacts;
    const [, setSelectedContact] = useContext(ContactsContext).selectedContact;

    useEffect(() => {
        (async () => {
            if (!selectedContact || selectedContact.isAccepted) {
                return;
            }

            const contactRequest =
                await contactRequestService.getContactRequestByInitiatorId(
                    selectedContact?._id,
                );
            if (!contactRequest) {
                return;
            }
            setContactRequest(contactRequest);
        })();
    }, [selectedContact?.isAccepted]);

    return (
        <div
            className={"p-8 bg-orange-50 mb-16"}
            style={{ minHeight: "calc(100% - 146px)" }}
        >
            {contactRequest !== undefined && (
                <Card>
                    <CardContent>
                        <p>
                            Do you want to accept {selectedContact?.name} as a
                            contact for further messages?
                        </p>
                    </CardContent>
                    <CardActions>
                        <Button
                            onClick={async () => {
                                await contactRequestService.respondToContactRequest(
                                    contactRequest._id,
                                    true,
                                );
                                setContacts((prevState) => {
                                    const contact = prevState.find(
                                        (contact) =>
                                            contact._id ===
                                            contactRequest.initiatorId,
                                    );
                                    if (!contact) {
                                        return prevState;
                                    }
                                    contact.isAccepted = true;
                                    return [...prevState];
                                });
                            }}
                        >
                            Yes
                        </Button>
                        <Button
                            onClick={async () => {
                                await contactRequestService.respondToContactRequest(
                                    contactRequest._id,
                                    false,
                                );
                                setContacts((prevState) => {
                                    const contact = prevState.find(
                                        (contact) =>
                                            contact._id ===
                                            contactRequest.initiatorId,
                                    );
                                    if (!contact) {
                                        return prevState;
                                    }
                                    return [
                                        ...prevState.filter(
                                            (c) => c !== contact,
                                        ),
                                    ];
                                });
                                setSelectedContact(undefined);
                                snackbarService.showSnackbar(
                                    `${selectedContact?.name} has been removed from contacts`,
                                    SnackbarLevels.SUCCESS,
                                );
                            }}
                        >
                            No
                        </Button>
                    </CardActions>
                </Card>
            )}
        </div>
    );
}
