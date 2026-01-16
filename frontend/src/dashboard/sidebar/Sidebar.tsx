import { Autocomplete, TextField } from "@mui/material";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ReactElement, useContext, useEffect, useState } from "react";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { useOnlineStatus } from "../../shared/contexts/OnlineStatusContext";
import { useHandleInputChange } from "../../helpers";
import { useUserContext } from "../../shared/contexts/UserContext";
import { Contact } from "../../shared/Contact";
import { TopSection } from "./top-section/TopSection";
import { User } from "@t/user.contract";
import { useDiContext } from "../../shared/contexts/DiContext";
import { useI18nContext } from "../../i18n/i18n-react";
import {
    SnackbarLevels,
    snackbarService,
} from "../../shared/contexts/SnackbarContext";
import { SocketContext } from "../../shared/contexts/SocketContext";
import { Message } from "@t/message.contract";
import { SocketMessageTypes } from "@t/socket-message-types.enum";

export function Sidebar() {
    const { LL } = useI18nContext();
    const [user, ,] = useUserContext();
    const userService = useDiContext().UserService;
    const contactsContext = useContext(ContactsContext);
    const contactService = useDiContext().ContactService;

    const [selectedContact, setSelectedContact] =
        contactsContext.selectedContact;
    const [userContacts, setUserContacts] = contactsContext.contacts;
    const { contactsOnlineStatus: userContactsOnlineStatus } = useOnlineStatus();
    const [userContactGroups] = contactsContext.contactGroups;
    const [socket] = useContext(SocketContext);
    const [lastMessage, setLastMessage] = useState<Message>();

    useEffect(() => {
        function updateLastMessage(message: Message) {
            const userContactWithNewMessage = userContacts.find(
                (uc) => uc._id === message.fromUserId,
            );
            if (userContactWithNewMessage) {
                userContactWithNewMessage.lastMessage = message._id;
                setUserContacts([...userContacts]);
            }
            setLastMessage(message);
        }

        if (socket) {
            socket.once(SocketMessageTypes.message, updateLastMessage);
        }
    }, [socket, user.username, lastMessage, userContacts]);

    const [, setFormData] = useState({
        contactName: "",
    });

    const [users, setUsers] = useState<User[]>([]);

    const handleInputChange = useHandleInputChange(setFormData);

    const [autoCompleteKey, setAutoCompleteKey] = useState<string>("false");

    const [nameFilter, setNameFilter] = useState<string | undefined>();

    const [contacts, setContacts] = useState<ReactElement[]>([]);

    const ADD_CONTACT_MARK = ` (${LL.ADD()})`;

    useEffect(() => {
        setContacts(contactList());
    }, [nameFilter, userContacts, userContactGroups, userContactsOnlineStatus]);

    function loadUserContacts() {
        userService.getUsers().then((users) => {
            if (!users) {
                return;
            }

            setUsers(
                users.filter(
                    (contact: User) =>
                        contact._id !== user._id &&
                        !userContacts.find((uc) => uc._id === contact._id),
                ),
            );
        });
    }

    useEffect(() => {
        contactService.getContacts().then((contacts) => setUserContacts(contacts));
    }, [user]);

    useEffect(() => {
        loadUserContacts();
    }, [userContacts]);

    function contactList() {
        return userContacts
            .concat(userContactGroups)
            .filter((contact) =>
                nameFilter !== undefined
                    ? contact.name.toLowerCase().match(nameFilter.toLowerCase())
                    : true,
            )
            .sort((uc1, uc2) => {
                const uc1MessageDate = uc1.lastMessage?.at;
                const uc2MessageDate = uc2.lastMessage?.at;

                if (uc1MessageDate && uc2MessageDate) {
                    return -uc1MessageDate
                        .toString()
                        .localeCompare(uc2MessageDate.toString());
                }

                return 0;
            })
            .map((c) => {
                return (
                    <Contact
                        key={c.name}
                        contact={c}
                        selectedContact={selectedContact}
                        onContactSelect={() => setSelectedContact(c)}
                        isOnline={userContactsOnlineStatus.get(c._id)}
                    />
                );
            });
    }

    async function addContact(evt: any) {
        const contactName = evt.target.textContent.replace(
            ADD_CONTACT_MARK,
            "",
        );

        if (!users.map((u) => u.username).includes(contactName ?? "")) {
            return;
        }

        const searchedUser =
            await userService.searchForUserByUsername(contactName);
        if (!searchedUser) {
            return;
        }
        const newContactResponse = await contactService.addContact(
            searchedUser._id,
        );
        if (newContactResponse.status !== 201) {
            return;
        }

        snackbarService.showSnackbar(
            LL.CONTACT_ADDED({ name: newContactResponse.body.name }),
            SnackbarLevels.SUCCESS,
        );

        setUserContacts((prevState) => {
            return [...prevState, newContactResponse.body];
        });

        setFormData({ contactName: "" });
        setAutoCompleteKey((!JSON.parse(autoCompleteKey)).toString());
        setNameFilter("");
    }

    return (
        <div
            className={
                "sidebar h-screen border bg-white" +
                (selectedContact ? " hidden md:block" : "")
            }
        >
            <TopSection />

            <div className={"flex"}>
                <Autocomplete
                    options={users.map((u) => u.username)}
                    getOptionLabel={(option) => option + ADD_CONTACT_MARK}
                    onChange={(evt) => {
                        setFormData({
                            contactName: (evt.target as any).textValue,
                        });
                        void addContact(evt);
                    }}
                    onInputChange={(evt: any) => {
                        if (evt.target.textContent) {
                            setNameFilter(evt.target.textContent);
                            return;
                        }
                        setNameFilter(evt.target.value);
                    }}
                    className={"w-full"}
                    freeSolo={true}
                    key={autoCompleteKey}
                    isOptionEqualToValue={(option, value) => option === value}
                    renderInput={(params) => (
                        <TextField
                            name={"contactName"}
                            {...params}
                            onInput={handleInputChange}
                            onBlur={handleInputChange}
                            label={
                                <div>
                                    <MagnifyingGlassIcon
                                        className={"w-4 inline mr-2"}
                                    />
                                    {LL.ADD_CONTACT()}
                                </div>
                            }
                        />
                    )}
                />
            </div>
            <div className={"border"}>
                {/*<div className={"border"}>*/}
                {/*    <Button*/}
                {/*        className={"text-start w-full"}*/}
                {/*        startIcon={<ArrowDownOnSquareIcon className={"h-8"} />}*/}
                {/*    >*/}
                {/*        {LL.ARCHIVED()}*/}
                {/*    </Button>*/}
                {/*</div>*/}
                <div className={"border"}>{contacts}</div>
            </div>
        </div>
    );
}
