import { Avatar } from "../../shared/Avatar";
import {
    ChevronDownIcon,
    MagnifyingGlassIcon,
    MicrophoneIcon,
    PhoneIcon,
    PlusIcon,
    VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { IconButton, Menu, MenuItem, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { MainChat } from "./main-chat/MainChat";
import { messageData } from "../../data/messages";
import { useHandleInputChange } from "../../helpers";

export function Chat(props: { selectedContact: string }) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const [messages, setMessages] = useState(
        messageData[Object.keys(messageData)[0]],
    );

    useEffect(() => {
        setMessages(messageData[props.selectedContact]);
    }, [props.selectedContact]);

    const [formData, setFormData] = useState<{ message: string }>({
        message: "",
    });

    const handleInputChange = useHandleInputChange(setFormData);

    function checkEnterPressed(event: unknown & { key: string }) {
        if (event.key === "Enter" && formData?.message) {
            const newMessageData = [...messageData[props.selectedContact]];
            newMessageData.push({
                from: "florian",
                at: new Date(),
                message: formData.message,
            });
            setMessages(newMessageData);
            setFormData({ message: "" });
        }
    }

    return (
        <div className={"h-screen w-full overflow-y-scroll"}>
            <div
                className={
                    "flex items-center border w-full p-2 justify-between sticky top-0 bg-white"
                }
            >
                <div className={"flex items-center"}>
                    <Avatar />
                    <p>{props.selectedContact}</p>
                </div>
                <div className={"flex"}>
                    <VideoCameraIcon className={"w-6 mr-3"} />
                    <PhoneIcon className={"w-6 mr-3"} />
                    <MagnifyingGlassIcon className={"w-6"} />
                    <IconButton
                        id="basic-button"
                        aria-controls={open ? "basic-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? "true" : undefined}
                        onClick={handleClick}
                    >
                        <ChevronDownIcon className={"w-8"} />
                    </IconButton>
                    <Menu
                        id="basic-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                            "aria-labelledby": "basic-button",
                        }}
                    >
                        <MenuItem onClick={handleClose}>Chat leeren</MenuItem>
                        <MenuItem onClick={handleClose}>Chat löschen</MenuItem>
                    </Menu>
                </div>
            </div>
            <MainChat messages={messages} />
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
        </div>
    );
}
