import "./SendMessageBar.css";
import { IconButton, TextField } from "@mui/material";
import {
    MicrophoneIcon,
    PaperAirplaneIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { checkEnterPressed, useHandleInputChange } from "../../../helpers";
import { useI18nContext } from "../../../i18n/i18n-react";
import { StopIcon } from "@heroicons/react/24/solid";
import { useMessageSending } from "../../../shared/hooks/useMessageSending";
import { useAudioRecording } from "../../../shared/hooks/useAudioRecording";
import { useFileUpload } from "../../../shared/hooks/useFileUpload";
import { Contact } from "@t/contact.contract";
import { ContactGroup } from "@t/contact-group.contract";

export function SendMessageBar(props: {
    selectedContact: Contact | ContactGroup;
}) {
    const { LL } = useI18nContext();
    const [formData, setFormData] = useState<{ message: string }>({
        message: "",
    });
    const selectedContact = props.selectedContact;

    const { sendMessage, sendIsTyping } = useMessageSending(selectedContact);

    const { startOfRecording, startRecordAudio, endRecordAudio } =
        useAudioRecording(selectedContact, sendMessage);

    const { fileInputRef, setFileToUpload } = useFileUpload(
        selectedContact,
        sendMessage,
    );

    const handleInputChange = useHandleInputChange(setFormData);

    async function sendOnEnterPressed(event: any) {
        if (checkEnterPressed(event) && formData?.message.trim().length) {
            await sendMessage(formData.message.trim());
            setFormData({ message: "" });
        }
    }

    return (
        <div className={"send-message-bar fixed bottom-0 bg-white p-3 flex"}>
            <IconButton onClick={() => fileInputRef.current?.click()}>
                <PlusIcon className={"w-8"} />
            </IconButton>
            <input
                type="file"
                ref={fileInputRef}
                hidden={true}
                onChange={(evt) => setFileToUpload(evt)}
                accept="image/jpeg, image/png, image/gif, image/bmp, image/tiff"
            />
            <TextField
                className={"w-full"}
                label={LL.ENTER_A_MESSAGE()}
                value={formData?.message}
                onKeyUp={sendOnEnterPressed}
                name={"message"}
                onChange={(evt) => {
                    handleInputChange(evt);
                    void sendIsTyping();
                }}
                multiline={true}
                // inputRef={(input) => input && input.focus()}
            ></TextField>

            {formData.message.trim().length >= 1 && (
                <IconButton
                    onPointerDown={async () => {
                        await sendMessage(formData.message.trim());
                        setFormData({ message: "" });
                    }}
                >
                    <PaperAirplaneIcon className={"send-message-button w-8"} />
                </IconButton>
            )}
            {formData.message.trim().length === 0 && !startOfRecording && (
                <IconButton onPointerDown={startRecordAudio}>
                    <MicrophoneIcon className={"send-audio-button w-8"} />
                </IconButton>
            )}
            {formData.message.trim().length === 0 && startOfRecording && (
                <IconButton onPointerDown={endRecordAudio}>
                    <StopIcon
                        className={"send-audio-button w-8 fill-red-500"}
                    />
                </IconButton>
            )}
        </div>
    );
}
