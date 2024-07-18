import { User } from "@t/user.contract";
import { useEffect } from "react";
import { Contact } from "@t/contact.contract";

export function Avatar(props: {
    width?: string;
    height?: string;
    user: User | Contact;
    squared?: boolean;
}) {
    useEffect(() => {}, [props.user?.avatarBase64]);

    return (
        <div
            className={"mr-3 flex justify-center items-center"}
            style={{
                minWidth: props.width ?? "2.5rem",
                minHeight: props.height ?? "2.5rem",
                maxWidth: props.width ?? "2.5rem",
                maxHeight: props.height ?? "2.5rem",
                backgroundColor: "lightblue",
                borderRadius: "50%",
            }}
        >
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
