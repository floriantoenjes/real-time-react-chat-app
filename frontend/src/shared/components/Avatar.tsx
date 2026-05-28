import { User } from "@t/user.contract";
import { useEffect } from "react";
import { Contact } from "@t/contact.contract";
import { ContactGroup, isContactGroup } from "@t/contact-group.contract";
import { UsersIcon } from "@heroicons/react/24/outline";

export function Avatar(props: {
    width?: string;
    height?: string;
    user: User | Contact | ContactGroup;
    squared?: boolean;
    isOnline?: boolean;
    noMargin?: boolean;
}) {
    useEffect(() => {}, [props.user?.avatarBase64]);

    return (
        <div
            className={
                "flex justify-center items-center relative " +
                (props.noMargin ? "" : "mr-3")
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
            {!isContactGroup(props.user) &&
                (props.user.avatarBase64 || props.user.avatarFileName) && (
                    <img
                        alt={"user avatar"}
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
            {isContactGroup(props.user) && (
                <UsersIcon width={"2rem"} fill={"white"} />
            )}
        </div>
    );
}
