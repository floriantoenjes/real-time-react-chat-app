import { IconButton, TextField } from "@mui/material";
import { MicrophoneIcon, PlusIcon } from "@heroicons/react/24/outline";
import { SetStateAction, useState } from "react";
import { useHandleInputChange } from "../../../helpers";
import { Message } from "../../../shared/types/Message";

export function SendMessageBar(props: {
    messages: Message[];
    setMessages: (value: SetStateAction<Message[]>) => void;
}) {
    const [formData, setFormData] = useState<{ message: string }>({
        message: "",
    });

    const handleInputChange = useHandleInputChange(setFormData);

    function checkEnterPressed(event: unknown & { key: string }) {
        if (event.key === "Enter" && formData?.message) {
            const newMessageData = [...props.messages];
            newMessageData.push({
                from: "florian",
                at: new Date(),
                message: formData.message,
            });
            props.setMessages(newMessageData);
            setFormData({ message: "" });
        }
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
            ></TextField>
            <IconButton>
                <MicrophoneIcon className={"w-8"} />
            </IconButton>
        </div>
    );
}
