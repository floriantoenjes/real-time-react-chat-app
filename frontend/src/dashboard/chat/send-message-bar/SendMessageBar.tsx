import { IconButton, TextField } from "@mui/material";
import { MicrophoneIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useContext, useState } from "react";
import { useHandleInputChange } from "../../../helpers";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { MessageContext } from "../../../shared/contexts/MessageContext";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";

export function SendMessageBar() {
    const [formData, setFormData] = useState<{ message: string }>({
        message: "",
    });
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [user] = useUserContext();
    const [messages, setMessages, messageService] = useContext(MessageContext);

    const handleInputChange = useHandleInputChange(setFormData);

    function checkEnterPressed(event: any) {
        event = event as KeyboardEvent;

        if (event.key === "Enter" && formData?.message.trim().length) {
            sendMessage();
            setFormData({ message: "" });
        }
    }

    function sendMessage() {
        if (!selectedContact) {
            return;
        }

        const messageToSend = {
            fromUserId: user._id,
            message: formData.message.trim(),
            toUserId: selectedContact.userId,
            at: new Date(),
        };

        void messageService.sendMessage(
            user._id,
            formData.message.trim(),
            selectedContact.userId,
        );

        setMessages([...messages, messageToSend]);
    }

    return (
        <div
            className={"send-message-bar fixed bottom-0 bg-white p-3 flex"}
            style={{ width: "calc(100% - 375px)" }}
        >
            <IconButton>
                <PlusIcon className={"w-8"} />
            </IconButton>
            <TextField
                className={"w-full"}
                label={"Gib eine Nachricht ein."}
                value={formData?.message}
                onKeyUp={checkEnterPressed}
                name={"message"}
                onChange={handleInputChange}
                multiline={true}
            ></TextField>
            <IconButton>
                <MicrophoneIcon className={"w-8"} />
            </IconButton>
        </div>
    );
}
