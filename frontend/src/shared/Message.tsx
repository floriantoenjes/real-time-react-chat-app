import { Message as MessageModel } from "real-time-chat-backend/shared/message.contract";
import { User } from "real-time-chat-backend/shared/user.contract";
import React, { useContext, useRef, useState } from "react";
import { ContactsContext } from "./contexts/ContactsContext";
import { CheckIcon } from "@heroicons/react/16/solid";
import { Button } from "@mui/material";
import { useDiContext } from "./contexts/DiContext";

export function Message(props: { msg: MessageModel; user: User }) {
    const [contacts] = useContext(ContactsContext).contacts;
    const fileService = useDiContext().FileService;

    const [image, setImage] = useState<string>();
    const audioRef = useRef<HTMLAudioElement>(null);

    let fromUsername = "";
    if (props.msg.fromUserId !== props.user._id) {
        fromUsername =
            (contacts.find((c) => c._id === props.msg.fromUserId)?.name ??
                "Unbekannt") + ": ";
    }

    async function loadImage() {
        if (props.msg.type !== "image") {
            return;
        }
        const image = await fileService.loadImage(
            props.user._id,
            props.msg.message,
        );
        setImage(image);
    }

    async function playAudio() {
        if (props.msg.type !== "audio") {
            return;
        }
        const audio = await fileService.loadFile(
            props.user._id,
            props.msg.message,
        );

        const file = new File([audio], "audio", { type: "audio/mp3" });
        new Audio(URL.createObjectURL(file)).play().then();
        // const current = audioRef.current;
        // if (current) {
        //     // const srcUrl = e.target.result;
        //     const srcUrl = `data:audio/mp3;base64,` + audio;
        //     console.log("srcUrl", srcUrl);
        //     if (srcUrl) {
        //         current.src = srcUrl.toString();
        //         void current.play();
        //     }
        // }
    }

    return (
        <div className={"w-full flex"}>
            <div
                className={
                    "border w-fit rounded p-3 m-3 max-w-96 flex" +
                    (props.msg.fromUserId === props.user._id.toString()
                        ? " ml-auto bg-green-300"
                        : " bg-white")
                }
            >
                <div className={"w-full"}>
                    <p>
                        {fromUsername}
                        {props.msg.message}
                    </p>
                    {!image && props.msg.type === "image" && (
                        <Button onClick={loadImage}>Show</Button>
                    )}
                    {image && <img src={`data:image/jpg;base64,${image}`} />}
                    {props.msg.type === "audio" && (
                        <div>
                            <Button onClick={playAudio}>Play</Button>
                            <audio ref={audioRef} />
                        </div>
                    )}
                </div>
                {props.msg.fromUserId === props.user._id.toString() &&
                    props.msg.sent && (
                        <CheckIcon className={"w-4 h-4 mt-auto"} />
                    )}
                {props.msg.fromUserId === props.user._id.toString() &&
                    props.msg.read && (
                        <CheckIcon
                            className={"w-4 h-4 mt-auto"}
                            style={{ marginLeft: "-0.5rem" }}
                        />
                    )}
            </div>
        </div>
    );
}
