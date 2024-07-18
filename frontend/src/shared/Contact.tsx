import { Avatar } from "./Avatar";
import { Contact as ContactModel } from "real-time-chat-backend/shared/contact.contract";
import { ContactGroup } from "real-time-chat-backend/shared/contact-group.contract";
import { DateTime } from "luxon";

export function Contact(props: {
    contact: ContactModel;
    selectedContact?: ContactModel | ContactGroup | undefined;
    onContactSelect?: () => void;
}) {
    return (
        <div
            className={
                "contact flex border p-2 cursor-pointer" +
                (props.selectedContact === props.contact ? " active" : "")
            }
            onClick={props.onContactSelect}
        >
            <Avatar width={"3rem"} height={"3rem"} user={props.contact} />
            <div className={"flex-col w-full"}>
                <div className={"flex justify-between"}>
                    <div>{props.contact.name}</div>
                    {props.contact.lastMessage && (
                        <div>
                            {DateTime.fromJSDate(
                                new Date(props.contact.lastMessage.at),
                            ).toFormat("dd.MM.yyyy")}
                        </div>
                    )}
                </div>
                <div className={"text-gray-500"} style={{ maxWidth: "18rem" }}>
                    {props.contact.lastMessage &&
                        (props.contact.lastMessage.message.length > 35
                            ? props.contact.lastMessage?.message.substring(
                                  0,
                                  35,
                              ) + "..."
                            : props.contact.lastMessage.message)}
                </div>
            </div>
        </div>
    );
}
