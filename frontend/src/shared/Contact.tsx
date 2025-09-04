import { Avatar } from "./Avatar";
import { Contact as ContactModel } from "real-time-chat-backend/shared/contact.contract";
import { ContactGroup } from "real-time-chat-backend/shared/contact-group.contract";
import { DateTime } from "luxon";
import { useDiContext } from "./contexts/DiContext";
import { useEffect, useState } from "react";
import { Message } from "@t/message.contract";

export function Contact(props: {
    contact: ContactModel;
    selectedContact?: ContactModel | ContactGroup | undefined;
    onContactSelect?: () => void;
    isOnline?: boolean;
}) {
    const messageService = useDiContext().MessageService;
    const [lastMessage, setLastMessage] = useState<Message | undefined>();

    useEffect(() => {
        (async () => {
            if (props.contact.lastMessage) {
                const res = await messageService.getMessageById(
                    props.contact.lastMessage,
                );

                if (res.status === 200) {
                    setLastMessage(res.body.message);
                }
            }
        })();
    }, [props.contact.lastMessage]);

    return (
        <div
            className={
                "contact flex border p-2 cursor-pointer" +
                (props.selectedContact === props.contact ? " active" : "")
            }
            onClick={props.onContactSelect}
        >
            <Avatar
                width={"3rem"}
                height={"3rem"}
                user={props.contact}
                isOnline={props.isOnline}
            />
            <div className={"flex-col w-full"}>
                <div className={"flex justify-between"}>
                    <div>{props.contact.name}</div>
                    {lastMessage && (
                        <div>
                            {DateTime.fromJSDate(
                                new Date(lastMessage.at),
                            ).toFormat("dd.MM.yyyy")}
                        </div>
                    )}
                </div>
                <div className={"text-gray-500"} style={{ maxWidth: "18rem" }}>
                    {lastMessage &&
                        (lastMessage.message.length > 35
                            ? lastMessage?.message.substring(0, 35) + "..."
                            : lastMessage.message)}
                </div>
            </div>
        </div>
    );
}
