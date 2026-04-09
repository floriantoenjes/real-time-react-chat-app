import { Message as MessageModel } from "real-time-chat-backend/shared/message.contract";
import { User } from "real-time-chat-backend/shared/user.contract";
import React, { useContext, useState } from "react";
import { ContactsContext } from "./contexts/ContactsContext";
import { CheckIcon } from "@heroicons/react/16/solid";
import { Button } from "@mui/material";
import { DateTime } from "luxon";
import { useI18nContext } from "../i18n/i18n-react";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useDiContext } from "./contexts/DiContext";

export function Message(props: { messageModel: MessageModel; user: User }) {
    const { LL } = useI18nContext();
    const [contacts] = useContext(ContactsContext).contacts;
    const fileService = useDiContext().FileService;

    const { audioDuration, secondsPlayed, playAudio, pauseAudio, playing } =
        useAudioPlayer(props.messageModel);

    const [image, setImage] = useState<string>();

    let fromUsername = "";
    if (props.messageModel.fromUserId !== props.user._id) {
        fromUsername =
            (contacts.find((c) => c._id === props.messageModel.fromUserId)
                ?.name ?? "Unbekannt") + ": ";
    }

    async function loadImage() {
        if (props.messageModel.type !== "image") {
            return;
        }
        const image = await fileService.loadImage(props.messageModel.message);
        if (!image) {
            return;
        }

        setImage(image);
    }

    function getMessageDate(msg: MessageModel) {
        return DateTime.fromJSDate(msg.at).toFormat("HH:mm");
    }

    return (
        <div className={"chat-message w-full flex"}>
            <div
                className={
                    "border border-blue-100 w-fit rounded-sm p-3 m-3 max-w-96 flex flex-col" +
                    (props.messageModel.fromUserId === props.user._id.toString()
                        ? " ml-auto bg-green-300"
                        : " bg-white")
                }
            >
                <div className={"w-full"}>
                    <p>
                        {fromUsername}
                        {props.messageModel.type === "text"
                            ? props.messageModel.message
                            : ""}
                    </p>

                    {props.messageModel.type === "audio" && (
                        <div>
                            <div
                                className={
                                    "my-3 h-1 bg-blue-500 relative rounded-full w-40"
                                }
                            >
                                <i
                                    className={
                                        "absolute -mt-1 bg-blue-500 fill-blue-500 h-3 w-3 rounded-full"
                                    }
                                    style={{
                                        left:
                                            (100 / audioDuration) *
                                                secondsPlayed +
                                            "%",
                                    }}
                                ></i>
                                <div className={"pt-3 flex justify-around"}>
                                    <span>
                                        {Math.floor(secondsPlayed / 60)
                                            .toString()
                                            .padStart(2, "0")}
                                        :
                                        {(Math.round(secondsPlayed) % 60)
                                            .toString()
                                            .padStart(2, "0")}
                                    </span>{" "}
                                    <span>-</span>
                                    <span>
                                        {Math.floor(audioDuration / 60)
                                            .toString()
                                            .padStart(2, "0")}
                                        :
                                        {(Math.round(audioDuration) % 60)
                                            .toString()
                                            .padStart(2, "0")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    {!image && props.messageModel.type === "image" && (
                        <Button onClick={loadImage}>{LL.SHOW_IMAGE()}</Button>
                    )}
                    {image && <img src={`data:image/jpg;base64,${image}`} />}
                    {props.messageModel.type === "audio" && (
                        <div className={"pl-0 pt-4"}>
                            {!playing && (
                                <Button onClick={playAudio}>Play</Button>
                            )}
                            {playing && (
                                <Button onClick={pauseAudio}>Pause</Button>
                            )}
                        </div>
                    )}
                </div>

                <footer className={"flex ml-auto"}>
                    <span className={"mt-auto text-xs"}>
                        {getMessageDate(props.messageModel)}
                    </span>

                    {props.messageModel.fromUserId ===
                        props.user._id.toString() &&
                        props.messageModel.sent && (
                            <CheckIcon className={"w-4 h-4 mt-auto"} />
                        )}
                    {props.messageModel.fromUserId ===
                        props.user._id.toString() &&
                        props.messageModel.read && (
                            <CheckIcon
                                className={"w-4 h-4 mt-auto"}
                                style={{ marginLeft: "-0.5rem" }}
                            />
                        )}
                </footer>
            </div>
        </div>
    );
}
