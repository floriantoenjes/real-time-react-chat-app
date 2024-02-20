import { Fab, IconButton } from "@mui/material";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import React, { useRef } from "react";
import { useUserContext } from "../../../../shared/contexts/UserContext";
import { Avatar } from "../../../../shared/Avatar";
import { CheckIcon } from "@heroicons/react/16/solid";

export function UserProfile(props: { toggleDrawer: any }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [user, , userService] = useUserContext();

    function handleAvatarSubmit(event: any) {
        console.log(event.target.files[0]);
        const formData = new FormData();
        formData.append("file", event.target.files[0], "avatar");

        void userService.uploadAvatar(event.target.files[0], user._id);
    }

    return (
        <div className={"drawer h-full"}>
            <div className={"drawer-head"}>
                <div className={"flex justify-center items-center py-5 "}>
                    <IconButton onClick={props.toggleDrawer("left", false)}>
                        <ArrowLeftIcon className={"w-8"} />
                    </IconButton>
                    <h4 className={"ml-3"}>Profil bearbeiten</h4>
                </div>
            </div>
            <div className={"flex flex-col justify-between items-center h-3/4"}>
                <div
                    className={"mt-3 avatar bg-blue-400 w-48 h-48 rounded"}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Avatar
                        user={user}
                        width={"12rem"}
                        height={"12rem"}
                        squared={true}
                    />
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    hidden={true}
                    onChange={handleAvatarSubmit}
                />
                <div className={"w-full"}>
                    <div className={"mt-auto mb-5 text-center"}>
                        <Fab>
                            <CheckIcon className={"w-8"} />
                        </Fab>
                    </div>
                </div>
            </div>
        </div>
    );
}
