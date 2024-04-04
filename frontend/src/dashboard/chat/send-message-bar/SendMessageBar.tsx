import "./SendMessageBar.css";
import { IconButton, TextField } from "@mui/material";
import { MicrophoneIcon, PlusIcon } from "@heroicons/react/24/outline";
import React, { useContext, useEffect, useRef, useState } from "react";
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
    // @ts-ignore
    const recorder = new MicRecorder({
        bitRate: 128,
    });
    let isRecording = useRef(false);

    const handleInputChange = useHandleInputChange(setFormData);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File>();

    useEffect(() => {
        window.addEventListener("mouseup", endRecordAudio);
        // window.addEventListener("touchend", endRecordAudio);

        return () => {
            window.removeEventListener("mouseup", endRecordAudio);
            // window.removeEventListener("touchend", endRecordAudio);
        };
    }, [recorder]);

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
        void sendMessage(file.name, "image");
    }

    async function startRecordAudio() {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(async () => {
            await new Audio("sounds/start_record.mp3").play();
            void recorder.start();
            isRecording.current = true;
        });
    }

    async function endRecordAudio() {
        if (!isRecording.current) {
            return;
        }
        isRecording.current = false;

        const fileName = `audio-${user._id}-${new Date().getTime()}`;
        const [buffer, blob] = await recorder.stop().getMp3();
        const file = new File(buffer, fileName, {
            type: blob.type,
            lastModified: Date.now(),
        });

        await messageService.sendFile(file, user._id);
        await sendMessage(fileName, "audio");
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
                    // onTouchStart={startRecordAudio}
                    onMouseDown={startRecordAudio}
                />
            </IconButton>
        </div>
    );
}
