import { Message as MessageModel } from "real-time-chat-backend/shared/message.contract";
import { User } from "real-time-chat-backend/shared/user.contract";
import React, { useContext, useEffect, useRef, useState } from "react";
import { ContactsContext } from "./contexts/ContactsContext";
import { CheckIcon } from "@heroicons/react/16/solid";
import { Button } from "@mui/material";
import { useDiContext } from "./contexts/DiContext";
import { DateTime } from "luxon";

export function Message(props: { msg: MessageModel; user: User }) {
    const [contacts] = useContext(ContactsContext).contacts;
    const fileService = useDiContext().FileService;

    const [image, setImage] = useState<string>();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [audioDuration, setAudioDuration] = useState<number>(0);
    const [secondsPlayed, setSecondsPlayed] = useState<number>(0);
    const [playing, setPlaying] = useState(false);
    const played = useRef(0);
    const playingRef = useRef(false);

    useEffect(() => {
        if (props.msg.type !== "audio") {
            return;
        }
        setAudioDuration(getAudioDuration(props.msg));
    }, [props.msg]);

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
        const image = await fileService.loadImage(props.msg.message);
        setImage(image);
    }

    async function playAudio() {
        if (props.msg.type !== "audio") {
            return;
        }
        const audio = await fileService.loadFile(props.msg.message);

        const file = new File([audio], "audio", { type: "audio/mp3" });
        if (secondsPlayed == 0) {
            audioRef.current = new Audio(URL.createObjectURL(file));
        }
        audioRef.current!.play().then(() => {
            setPlaying(true);
            playingRef.current = true;

            const playInterval = setInterval(() => {
                if (!playingRef.current || played.current >= audioDuration) {
                    clearInterval(playInterval);
                    setPlaying(false);
                    playingRef.current = false;
                    if (played.current >= audioDuration) {
                        setSecondsPlayed(0);
                        played.current = 0;
                    }
                    return;
                }

                setSecondsPlayed((seconds) => seconds + 0.1);
                played.current += 0.1;
            }, 100);
        });
    }

    function pauseAudio() {
        setPlaying(false);
        playingRef.current = false;
        audioRef.current?.pause();
    }

    function splitAudioMessage(msg: MessageModel) {
        const [type, storageId, dateInMilliSeconds, duration] =
            msg.message.split("-");

        return { storageId, dateInMilliSeconds, duration };
    }

    function getAudioMessageDate(msg: MessageModel) {
        return DateTime.fromMillis(+splitAudioMessage(msg).dateInMilliSeconds)
            .toJSDate()
            .toLocaleString();
    }

    function getAudioDuration(msg: MessageModel) {
        return Math.floor(+splitAudioMessage(msg).duration.substring(1));
    }

    return (
        <div className={"chat-message w-full flex"}>
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
                        {props.msg.type === "text" ? props.msg.message : ""}
                    </p>

                    {props.msg.type === "audio" && (
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
                    {!image && props.msg.type === "image" && (
                        <Button onClick={loadImage}>Show Image</Button>
                    )}
                    {image && <img src={`data:image/jpg;base64,${image}`} />}
                    {props.msg.type === "audio" && (
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
