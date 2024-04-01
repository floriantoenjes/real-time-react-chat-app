import { Message as MessageModel } from "real-time-chat-backend/shared/message.contract";
import { User } from "real-time-chat-backend/shared/user.contract";
import { useContext } from "react";
import { ContactsContext } from "./contexts/ContactsContext";
import { CheckIcon } from "@heroicons/react/16/solid";
import { Button } from "@mui/material";

export function Message(props: { msg: MessageModel; user: User }) {
    const [contacts] = useContext(ContactsContext).contacts;

    let fromUsername = "";
    if (props.msg.fromUserId !== props.user._id) {
        fromUsername =
            (contacts.find((c) => c._id === props.msg.fromUserId)?.name ??
                "Unbekannt") + ": ";
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
                <p>
                    {fromUsername}
                    {props.msg.message}
                </p>
                {props.msg.type === "image" && <Button>Show</Button>}
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
