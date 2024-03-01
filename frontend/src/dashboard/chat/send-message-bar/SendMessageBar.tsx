import { IconButton, TextField } from "@mui/material";
import { MicrophoneIcon, PlusIcon } from "@heroicons/react/24/outline";
import React, { useContext, useRef, useState } from "react";
import { checkEnterPressed, useHandleInputChange } from "../../../helpers";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { MessageContext } from "../../../shared/contexts/MessageContext";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useDiContext } from "../../../shared/contexts/DiContext";

export function SendMessageBar() {
    const [formData, setFormData] = useState<{ message: string }>({
        message: "",
    });
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [user] = useUserContext();
    const [messages, setMessages] = useContext(MessageContext);
    const messageService = useDiContext().MessageService;

    const handleInputChange = useHandleInputChange(setFormData);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File>();

    async function sendOnEnterPressed(event: any) {
        if (checkEnterPressed(event) && formData?.message.trim().length) {
            await sendMessage();
            setFormData({ message: "" });
        }
    }

    async function sendMessage() {
        if (!selectedContact) {
            return;
        }

        const messageToSend = {
            fromUserId: user._id,
            message: formData.message.trim(),
            toUserId: selectedContact._id,
            at: new Date(),
        };

        const res = await messageService.sendMessage(
            user._id,
            formData.message.trim(),
            selectedContact._id,
        );

        if (res.status === 201) {
            setMessages([...messages, res.body]);
        }
    }

    function setFileToUpload(event: any) {
        setFile(event.target.files[0]);
        console.log(file);
    }

    return (
        <div
            className={"send-message-bar fixed bottom-0 bg-white p-3 flex"}
            style={{ minWidth: "calc(100% - 375px)", width: "100%" }}
        >
            <IconButton onClick={() => fileInputRef.current?.click()}>
                <PlusIcon className={"w-8"} />
            </IconButton>
            <input
                type="file"
                ref={fileInputRef}
                hidden={true}
                onChange={setFileToUpload}
            />
            <TextField
                className={"w-full"}
                label={"Gib eine Nachricht ein."}
                value={formData?.message}
                onKeyUp={sendOnEnterPressed}
                name={"message"}
                onChange={handleInputChange}
                multiline={true}
                // inputRef={(input) => input && input.focus()}
            ></TextField>
            <IconButton>
                <MicrophoneIcon className={"w-8"} />
            </IconButton>
        </div>
    );
}
