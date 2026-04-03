import { useRef } from "react";
import { useDiContext } from "../contexts/DiContext";
import { Contact } from "@t/contact.contract";
import { ContactGroup } from "@t/contact-group.contract";

/**
 * Custom hook for handling file upload functionality
 * @param selectedContact - The currently selected contact or contact group
 * @param sendMessage - Function to send the uploaded file message
 * @returns Object containing file upload ref and handler
 */
export function useFileUpload(
    selectedContact: Contact | ContactGroup,
    sendMessage: (message: string, type: "image") => Promise<void>,
) {
    const messageService = useDiContext().MessageService;
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function setFileToUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        const res = await messageService.sendFile(file, "image", [
            selectedContact._id,
        ]);

        if (res.status === 201) {
            const sanitizedFilename = res.body;
            await sendMessage(sanitizedFilename, "image");
        }
    }

    return {
        fileInputRef,
        setFileToUpload,
    };
}
