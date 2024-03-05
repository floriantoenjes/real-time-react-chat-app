import { createRef, useContext, useEffect } from "react";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { MessageContext } from "../../../shared/contexts/MessageContext";
import { Message } from "../../../shared/Message";

export function MainChat() {
    const [user] = useUserContext();
    const [messages] = useContext(MessageContext);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView();
    });

    const messagesEndRef = createRef<HTMLDivElement>();

    function messageList() {
        return (messages ?? []).map((msg) => {
            return <Message msg={msg} user={user} key={msg._id} />;
        });
    }

    return (
        <div
            className={"p-8 bg-orange-50 mb-16"}
            style={{ minHeight: "calc(100% - 146px)" }}
        >
            {messageList()} <div ref={messagesEndRef}></div>
        </div>
    );
}
