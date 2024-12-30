import "./SendMessageBar.css";
import { IconButton, TextField } from "@mui/material";
import {
    MicrophoneIcon,
    PaperAirplaneIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { checkEnterPressed, useHandleInputChange } from "../../../helpers";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { MessageContext } from "../../../shared/contexts/MessageContext";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useDiContext } from "../../../shared/contexts/DiContext";
import { Message } from "@t/message.contract";
import { SocketContext } from "../../../shared/contexts/SocketContext";
import { DateTime } from "luxon";
import { StopIcon } from "@heroicons/react/24/solid";

export function SendMessageBar() {
    const [formData, setFormData] = useState<{ message: string }>({
        message: "",
    });
    const [selectedContact] = useContext(ContactsContext).selectedContact;
    const [, setContacts] = useContext(ContactsContext).contacts;
    const [user] = useUserContext();
    const [messages, setMessages] = useContext(MessageContext);
    const messageService = useDiContext().MessageService;

    const recorder = useMemo(
        () =>
            // @ts-ignore
            new MicRecorder({
                bitRate: 128,
            }),
        [],
    );
    let startOfRecordingRef = useRef<Date | null>(null);
    const [startOfRecording, setStartOfRecording] = useState<Date | null>(null);

    const handleInputChange = useHandleInputChange(setFormData);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [, setFile] = useState<File>();
    const [socket] = useContext(SocketContext);
    let [isTyping, setIsTyping] = useState<boolean>(false);

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
            await recorder.start();
            startOfRecordingRef.current = new Date();
            setStartOfRecording(new Date());
        });
    }

    async function endRecordAudio() {
        if (!startOfRecordingRef.current) {
            return;
        }
        const duration = DateTime.fromJSDate(new Date()).diff(
            DateTime.fromJSDate(startOfRecordingRef.current),
            "seconds",
        );
        startOfRecordingRef.current = null;
        setStartOfRecording(null);

        const fileName = `audio-${user._id}-${new Date().getTime()}-d${duration.as("seconds")}`;
        const [buffer, blob] = await recorder.stop().getMp3();
        const file = new File(buffer, fileName, {
            type: blob.type,
            lastModified: Date.now(),
        });

        await messageService.sendFile(file, user._id);
        await sendMessage(fileName, "audio");
    }

    async function sendIsTyping() {
        if (isTyping) {
            return;
        }
        setIsTyping(true);
        socket?.emit("typing", {
            userId: user._id,
            contactId: selectedContact?._id,
        });

        setTimeout(() => {
            setIsTyping(false);
        }, 5000);
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
                onChange={(evt) => {
                    handleInputChange(evt);
                    void sendIsTyping();
                }}
                multiline={true}
                // inputRef={(input) => input && input.focus()}
            ></TextField>

            {formData.message.trim().length >= 1 && (
                <IconButton
                    onPointerDown={async (event) => {
                        await sendMessage();
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
