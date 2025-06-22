import { Fab, IconButton } from "@mui/material";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import React, { useRef, useState } from "react";
import { useUserContext } from "../../../../shared/contexts/UserContext";
import { CheckIcon } from "@heroicons/react/16/solid";
import Cropper, { Area, Point } from "react-easy-crop";
import { Avatar } from "../../../../shared/Avatar";
import { useDiContext } from "../../../../shared/contexts/DiContext";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { getSetUserWithAvatarBytes } from "../../../../shared/helpers";
import {
    SnackbarLevels,
    snackbarService,
} from "../../../../shared/contexts/SnackbarContext";
import { useI18nContext } from "../../../../i18n/i18n-react";

export function UserProfile(props: { toggleDrawer: any }) {
    const { LL } = useI18nContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [user, setUser] = useUserContext();
    const [file, setFile] = useState<File>();
    const [fileChanged, setFileChanged] = useState(false);

    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    const [croppedArea, setCroppedArea] = useState<Area>();
    const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedArea(croppedAreaPixels);
    };
    const userService = useDiContext().UserService;

    function handleAvatarSubmit() {
        if (!file || !croppedArea) {
            return;
        }

        void userService
            .uploadAvatar(
                file,
                croppedArea.x,
                croppedArea.y,
                croppedArea.width,
                croppedArea.height,
                user._id,
            )
            .then(() => {
                getSetUserWithAvatarBytes(userService)(setUser)({
                    ...user,
                    avatarFileName: user._id + "_avatar",
                });
                props.toggleDrawer("left", false)();
                snackbarService.showSnackbar(
                    LL.AVATAR_UPDATED(),
                    SnackbarLevels.SUCCESS,
                );
            })
            .catch((error) => {
                props.toggleDrawer("left", false)();
                snackbarService.showSnackbar(
                    LL.ERROR.AVATAR_NOT_UPDATED(),
                    SnackbarLevels.ERROR,
                );
                throw error;
            });
    }

    function setFileToUpload(event: any) {
        setFileChanged(true);
        setFile(event.target.files[0]);
    }

    return (
        <div className={"drawer h-full"}>
            <div className={"drawer-head"}>
                <div className={"flex justify-center items-center py-5 "}>
                    <IconButton onClick={props.toggleDrawer("left", false)}>
                        <ArrowLeftIcon className={"w-8"} />
                    </IconButton>
                    <h4 className={"ml-3"}>{LL.EDIT_PROFILE()}</h4>
                </div>
            </div>
            <div className={"flex flex-col justify-between items-center h-3/4"}>
                <div
                    className={
                        "mt-3 avatar bg-blue-400 w-48 h-48 relative cursor-pointer rounded-xl"
                    }
                    onClick={() => fileInputRef.current?.click()}
                >
                    <PencilSquareIcon
                        className={
                            "w-12 h-12 absolute z-10 right-0 bottom-0 bg-white rounded-full p-3 m-2"
                        }
                    ></PencilSquareIcon>
                    <Avatar
                        user={user}
                        width={"12rem"}
                        height={"12rem"}
                        squared={true}
                    />
                </div>
                {fileInputRef.current?.files?.[0] && (
                    <Cropper
                        classes={{ containerClassName: "z-10" }}
                        image={URL.createObjectURL(
                            fileInputRef.current.files[0],
                        )}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                    />
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    hidden={true}
                    onChange={setFileToUpload}
                />
                <div className={"w-full"}>
                    <div className={"mt-auto mb-5 text-center"}>
                        {fileChanged && (
                            <Fab onClick={handleAvatarSubmit}>
                                <CheckIcon className={"w-8"} />
                            </Fab>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
