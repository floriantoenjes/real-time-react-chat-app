import { Message, Message as MessageModel } from "@t/message.contract";
import { useEffect, useRef, useState } from "react";
import { useDiContext } from "../contexts/DiContext";

export function useAudioPlayer(message: Message) {
    const fileService = useDiContext().FileService;
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [audioDuration, setAudioDuration] = useState<number>(0);
    const [secondsPlayed, setSecondsPlayed] = useState<number>(0);
    const [playing, setPlaying] = useState(false);
    const played = useRef(0);
    const playingRef = useRef(false);

    useEffect(() => {
        if (message.type !== "audio") {
            return;
        }
        setAudioDuration(getAudioDuration(message));
    }, [message]);

    async function playAudio() {
        if (message.type !== "audio") {
            return;
        }
        const audio = await fileService.loadFile(message.message);
        if (!audio) {
            return;
        }

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
        // type, storageId, dateInMilliSeconds, duration
        const [, storageId, dateInMilliSeconds, duration] =
            msg.message.split("-");

        return {
            storageId,
            dateInMilliSeconds,
            duration,
        };
    }

    function getAudioDuration(msg: MessageModel) {
        const durationMatch = splitAudioMessage(msg).duration.match(/\d+/);
        if (!durationMatch?.length) {
            throw new Error("No audio duration provided");
        }
        return Math.floor(+durationMatch[0]);
    }

    return {
        secondsPlayed,
        audioDuration,
        playAudio,
        pauseAudio,
        playing,
    };
}
