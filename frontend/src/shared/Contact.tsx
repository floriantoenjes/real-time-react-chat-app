import { Avatar } from "./Avatar";
import { Contact as ContactModel } from "real-time-chat-backend/dist/shared/contact.contract";
import { Dispatch, SetStateAction } from "react";

export function Contact(props: {
    contact: ContactModel;
    selectedContact?: ContactModel | undefined;
    setSelectedContact?: Dispatch<SetStateAction<ContactModel | undefined>>;
}) {
    return (
        <div
            className={
                "contact flex border p-2 cursor-pointer" +
                (props.selectedContact === props.contact ? " active" : "")
            }
            onClick={() =>
                props.setSelectedContact &&
                props.setSelectedContact(props.contact)
            }
        >
            <Avatar width={"3.4rem"} height={"2.8rem"} />
            <div className={"flex-col w-full"}>
                <div className={"flex justify-between"}>
                    <div>{props.contact.username}</div>
                    <div>{props.contact.lastMessage?.at?.toString()}</div>
                </div>
                <div>{props.contact.lastMessage?.message}</div>
            </div>
        </div>
    );
}
