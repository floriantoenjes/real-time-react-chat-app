import { useContext, useEffect, useEffectEvent, useState } from "react";
import { SocketContext } from "../contexts/SocketContext";
import { SocketMessageTypes } from "@t/socket-message-types.enum";

/**
 * Custom hook for handling typing indicator WebSocket events
 * @param selectedContactId - The ID of the currently selected contact
 * @returns Object containing isTyping state
 */
export function useTypingIndicator(selectedContactId: string) {
    const [socket] = useContext(SocketContext);
    const [isTyping, setIsTyping] = useState<boolean>(false);

    const onTyping = useEffectEvent(
        (body: { userId: string; isTyping: boolean }) => {
            if (body.userId === selectedContactId) {
                setIsTyping(body.isTyping);
                setTimeout(() => {
                    setIsTyping(false);
                }, 5000);
            }
        },
    );

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.on(SocketMessageTypes.typing, onTyping);
        return () => {
            socket.off(SocketMessageTypes.typing, onTyping);
        };
    }, [socket, selectedContactId]);

    return {
        isTyping,
    };
}
