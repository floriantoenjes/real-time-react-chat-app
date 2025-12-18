import { User } from "@t/user.contract";
import { useEffect } from "react";
import { Contact } from "@t/contact.contract";

export function Avatar(props: {
    width?: string;
    height?: string;
    user: User | Contact;
    squared?: boolean;
    isOnline?: boolean;
    noMargin?: boolean;
}) {
    useEffect(() => {}, [props.user?.avatarBase64]);

    return (
        <div
            className={
                "flex justify-center items-center relative" + props.noMargin
                    ? ""
                    : "mr - 3"
            }
            style={{
                minWidth: props.width ?? "2.5rem",
                minHeight: props.height ?? "2.5rem",
                maxWidth: props.width ?? "2.5rem",
                maxHeight: props.height ?? "2.5rem",
                backgroundColor: "lightblue",
                borderRadius: "50%",
                position: "relative",
            }}
        >
            {props.isOnline && (
                <div
                    className={
                        "bg-green-500 rounded-full w-3 h-3 absolute right-0 bottom-0"
                    }
                ></div>
            )}
            {(props.user.avatarBase64 || props.user.avatarFileName) && (
                <img
                    style={{
                        maxHeight: "100%",
                        borderRadius: props.squared ? "5%" : "50%",
                    }}
                    src={
                        props.user?.avatarBase64
                            ? `data:image/jpg;base64,${
                                  props.user?.avatarBase64?.current ??
                                  props.user.avatarBase64
                              }`
                            : "avatars/" + props.user?.avatarFileName
                    }
                />
            )}
        </div>
    );
}
