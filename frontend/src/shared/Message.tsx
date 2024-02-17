import { Message as MessageModel } from "real-time-chat-backend/shared/message.contract";
import { User } from "real-time-chat-backend/shared/user.contract";
import { useContext } from "react";
import { ContactsContext } from "./contexts/ContactsContext";

export function Message(props: { msg: MessageModel; user: User }) {
    const [contacts] = useContext(ContactsContext).contacts;

    let fromUsername = "";
    if (props.msg.fromUserId !== props.user._id) {
        fromUsername =
            contacts.find((c) => c._id === props.msg.fromUserId)?.name + ": ";
    }

    return (
        <div className={"w-full flex"}>
            <div
                className={
                    "border w-fit rounded p-3 m-3 max-w-96" +
                    (props.msg.fromUserId === props.user._id.toString()
                        ? " ml-auto bg-green-300"
                        : " bg-white")
                }
            >
                <p>
                    {fromUsername}
                    {props.msg.message}
                </p>
            </div>
        </div>
    );
}
