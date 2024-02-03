import { createRef, useContext, useEffect } from "react";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { MessageContext } from "../../../shared/contexts/MessageContext";

export function MainChat() {
    const [user] = useUserContext();
    const [messages] = useContext(MessageContext);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView();
    });

    const messagesEndRef = createRef<HTMLDivElement>();

    function messageList() {
        return (messages ?? []).map((msg) => {
            return (
                <div className={"w-full flex"} key={Math.random() * 1_000_000}>
                    <div
                        className={
                            "border w-fit rounded p-3 m-3 max-w-96" +
                            (msg.from === user.username
                                ? " ml-auto bg-green-300"
                                : " bg-white")
                        }
                    >
                        <p>{msg.message}</p>
                    </div>
                </div>
            );
        });
    }

    return (
        <div className={"p-8 bg-orange-50 mb-16"} style={{ minHeight: "80%" }}>
            {messageList()} <div ref={messagesEndRef}></div>
        </div>
    );
}
