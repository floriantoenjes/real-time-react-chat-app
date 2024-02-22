import { User } from "@t/user.contract";
import { useEffect } from "react";
import { Contact } from "@t/contact.contract";

export function Avatar(props: {
    width?: string;
    height?: string;
    user: User | Contact;
    squared?: boolean;
}) {
    useEffect(() => {}, [props.user?.avatarBase64?.current]);

    return (
        <div
            className={"mr-3 flex justify-center items-center"}
            style={{
                width: props.width ?? "2.5rem",
                height: props.height ?? "2.5rem",
                backgroundColor: "lightblue",
                borderRadius: "50%",
            }}
        >
            <img
                style={{
                    maxHeight: "100%",
                    borderRadius: props.squared ? "" : "50%",
                }}
                // src={ : undefined}
                src={
                    props.user?.avatarBase64
                        ? `data:image/jpg;base64,${
                              props.user?.avatarBase64?.current ??
                              props.user.avatarBase64
                          }`
                        : "avatars/" + props.user?.avatarFileName ?? ""
                }
            />
        </div>
    );
}
