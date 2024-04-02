import { IconButton, TextField } from "@mui/material";
import { MicrophoneIcon, PlusIcon } from "@heroicons/react/24/outline";
import React, { useContext, useRef, useState } from "react";
import { checkEnterPressed, useHandleInputChange } from "../../../helpers";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { MessageContext } from "../../../shared/contexts/MessageContext";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useDiContext } from "../../../shared/contexts/DiContext";
import { Message } from "@t/message.contract";

export function SendMessageBar() {
    const [formData, setFormData] = useState<{ message: string }>({
        message: "",
    });
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [, setContacts] = useContext(ContactsContext).contacts;
    const [user] = useUserContext();
    const [messages, setMessages] = useContext(MessageContext);
    const messageService = useDiContext().MessageService;
    const audioService = useDiContext().AudioService;

    const handleInputChange = useHandleInputChange(setFormData);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File>();

    async function sendOnEnterPressed(event: any) {
        if (checkEnterPressed(event) && formData?.message.trim().length) {
            await sendMessage();
            setFormData({ message: "" });
        }
    }

    async function sendMessage(
        message: string = formData.message.trim(),
        type: Message["type"] = "text",
    ) {
        if (!selectedContact) {
            return;
        }

        const messageToSend = {
            message,
            fromUserId: user._id,
            toUserId: selectedContact._id,
        };
        setMessages([
            ...messages,
            {
                ...messageToSend,
                _id: "temp-" + new Date().toString(),
                at: new Date(),
                read: false,
                sent: false,
                type,
            },
        ]);

        const res = await messageService.sendMessage(
            user._id,
            message,
            selectedContact._id,
            type,
        );

        setContacts((prevState) => {
            const contact = prevState.find(
                (c) => c._id === selectedContact._id,
            );
            if (contact && res.status === 201) {
                contact.lastMessage = res.body;
            }

            return prevState;
        });

        if (res.status === 201) {
            setMessages((prevState) => {
                const msgIdx = prevState.findIndex(
                    (msg) =>
                        msg.fromUserId === messageToSend.fromUserId &&
                        msg.toUserId === messageToSend.toUserId &&
                        msg.message === messageToSend.message,
                );
                prevState[msgIdx] = res.body;

                return [...prevState];
            });
        }
    }

    function setFileToUpload(event: any) {
        const file = event.target.files[0];
        setFile(file);
        void messageService.sendFile(file, user._id);
        console.log(file.name);
        void sendMessage(file.name, "image");
    }

    function startRecordAudio() {
        audioService.startAudioRecording();
    }

    async function endRecordAudio() {
        const recording = await audioService.stop();
        await messageService.sendFile(new File([recording], "audio"), user._id);
        await sendMessage("audio", "audio");

        const reader = new FileReader();
        reader.onload = function (e) {
            console.log(e.target?.result);
        };
        reader.readAsDataURL(
            new Blob([recording], { type: "audio/webm;codecs=opus" }),
        );
    }

    return (
        <div
            className={"send-message-bar fixed bottom-0 bg-white p-3 flex"}
            style={{ minWidth: "calc(100% - 375px)" }}
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
                <MicrophoneIcon
                    className={"w-8"}
                    onTouchStart={startRecordAudio}
                    onTouchEnd={endRecordAudio}
                    onMouseDown={startRecordAudio}
                    onMouseUp={endRecordAudio}
                />
            </IconButton>
        </div>
    );
}
