import { IconButton, TextField } from "@mui/material";
import { MicrophoneIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useContext, useState } from "react";
import { useHandleInputChange } from "../../../helpers";
import axios from "axios";
import { UserContext } from "../../../shared/contexts/UserContext";

export function SendMessageBar() {
    const [formData, setFormData] = useState<{ message: string }>({
        message: "",
    });
    const [user] = useContext(UserContext);

    const handleInputChange = useHandleInputChange(setFormData);

    function checkEnterPressed(event: unknown & { key: string }) {
        if (event.key === "Enter" && formData?.message) {
            sendMessage();
            setFormData({ message: "" });
        }
    }

    function sendMessage() {
        void axios.post("http://localhost:4200/send", {
            message: formData.message,
            username: user?.username.toLowerCase(),
        });
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
