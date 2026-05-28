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
import { useI18nContext } from "../../../i18n/i18n-react";
import { IgnoreConfirmationDialog } from "../../../shared/components/IgnoreConfirmationDialog";

interface ContactRequestProps {
    selectedContact?: Contact | ContactGroup;
}

export function ContactRequest({ selectedContact }: ContactRequestProps) {
    const contactRequestService = useDiContext().ContactRequestService;
    const ignoredUserService = useDiContext().IgnoredUserService;
    const [contactRequest, setContactRequest] = useState<ContactRequest>();
    const [, setContacts] = useContext(ContactsContext).contacts;
    const [, setSelectedContact] = useContext(ContactsContext).selectedContact;
    const { LL } = useI18nContext();
    const [ignoreDialogOpen, setIgnoreDialogOpen] = useState(false);

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
            {contactRequest !== undefined && selectedContact && (
                <Card>
                    <CardContent>
                        <p>
                            {LL.ACCEPT_CONTACT_QUESTION({
                                contactName: selectedContact.name,
                            })}
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
                                setSelectedContact((prevState) => {
                                    if (!prevState) {
                                        return prevState;
                                    }
                                    return {
                                        ...prevState,
                                        isAccepted: true,
                                    };
                                });
                                snackbarService.showSnackbar(
                                    LL.CONTACT_ENABLED({
                                        contactName: selectedContact.name,
                                    }),
                                    SnackbarLevels.SUCCESS,
                                );
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
                                    LL.CONTACT_REMOVED({
                                        name: selectedContact.name,
                                    }),
                                    SnackbarLevels.SUCCESS,
                                );
                            }}
                        >
                            No
                        </Button>
                        <Button
                            onClick={() => setIgnoreDialogOpen(true)}
                            color="error"
                        >
                            {LL.IGNORE()}
                        </Button>
                    </CardActions>
                </Card>
            )}

            <IgnoreConfirmationDialog
                open={ignoreDialogOpen}
                onClose={() => setIgnoreDialogOpen(false)}
                onConfirm={async () => {
                    if (!contactRequest || !selectedContact) {
                        return;
                    }
                    await ignoredUserService.ignoreFromContactRequest(
                        contactRequest._id,
                    );
                    setContacts((prevState) => {
                        return prevState.filter(
                            (c) => c._id !== contactRequest.initiatorId,
                        );
                    });
                    setSelectedContact(undefined);
                    snackbarService.showSnackbar(
                        LL.IGNORE_USER_SUCCESS({
                            contactName: selectedContact.name,
                        }),
                        SnackbarLevels.SUCCESS,
                    );
                }}
                contactName={selectedContact?.name ?? ""}
            />
        </div>
    );
}
