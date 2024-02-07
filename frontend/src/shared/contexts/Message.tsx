import { Message as MessageModel } from "real-time-chat-backend/dist/shared/message.contract";
import { User } from "real-time-chat-backend/dist/shared/user.contract";

export function Message(props: { msg: MessageModel; user: User }) {
    return (
        <div className={"w-full flex"} key={Math.random() * 1_000_000}>
            <div
                className={
                    "border w-fit rounded p-3 m-3 max-w-96" +
                    (props.msg.fromUserId === props.user._id.toString()
                        ? " ml-auto bg-green-300"
                        : " bg-white")
                }
            >
                <p>{props.msg.message}</p>
            </div>
        </div>
    );
}
