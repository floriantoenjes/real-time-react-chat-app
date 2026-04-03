import { useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import { useUserContext } from "../contexts/UserContext";
import { useDiContext } from "../contexts/DiContext";
import { Contact } from "@t/contact.contract";
import { ContactGroup } from "@t/contact-group.contract";

/**
 * Custom hook for handling audio recording functionality
 * @param selectedContact - The currently selected contact or contact group
 * @param sendMessage - Function to send the recorded audio message
 * @returns Object containing audio recording state and functions
 */
export function useAudioRecording(
    selectedContact: Contact | ContactGroup,
    sendMessage: (message: string, type: "audio") => Promise<void>,
) {
    const [user] = useUserContext();
    const messageService = useDiContext().MessageService;

    const recorder = useMemo(
        () =>
            // @ts-expect-error No typings for the MicRecorder
            new MicRecorder({
                bitRate: 128,
            }),
        [],
    );

    const startOfRecordingRef = useRef<Date | null>(null);
    const [startOfRecording, setStartOfRecording] = useState<Date | null>(null);

    async function startRecordAudio() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            await new Audio("sounds/start_record.mp3").play();
            await recorder.start();
            startOfRecordingRef.current = new Date();
            setStartOfRecording(new Date());

            // Clean up stream when component unmounts or recording stops
            return () => {
                stream.getTracks().forEach((track) => track.stop());
            };
        } catch (error) {
            console.error("Error accessing microphone:", error);
            return () => {};
        }
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

        const res = await messageService.sendFile(file, "audio", [
            selectedContact._id,
        ]);

        if (res.status === 201) {
            const sanitizedFilename = res.body;
            await sendMessage(sanitizedFilename, "audio");
        }
    }

    return {
        startOfRecording,
        startRecordAudio,
        endRecordAudio,
    };
}
