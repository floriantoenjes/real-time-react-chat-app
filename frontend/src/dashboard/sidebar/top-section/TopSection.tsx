import { Drawer, IconButton, Menu, MenuItem } from "@mui/material";
import {
    ArrowRightStartOnRectangleIcon,
    ChevronDownIcon,
    GlobeAltIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import React from "react";
import "./TopSection.css";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { Avatar } from "../../../shared/Avatar";
import { UserProfile } from "./user-profile/UserProfile";
import { GroupCreation } from "./group-creation/GroupCreation";
import { useI18nContext } from "../../../i18n/i18n-react";
import { LanguageModal } from "./language-modal/LanguageModal";
import { useSidebarTopSectionUI } from "../../../shared/hooks/useSidebarTopSectionUI";
import { useSignOutAction } from "../../../shared/hooks/useSignOutAction";

export function TopSection() {
    const { LL } = useI18nContext();
    const [user] = useUserContext();

    const { signOut } = useSignOutAction();

    const {
        anchorEl,
        toggleDrawer,
        handleClick,
        handleClose,
        showLanguageModal,
        open,
        section,
        modalOpen,
        setModalOpen,
        drawerOpenState,
    } = useSidebarTopSectionUI();

    return (
        <>
            <div className={"flex items-center mb-3"}>
                <div
                    className={"ml-3 cursor-pointer"}
                    onClick={toggleDrawer("left", true, "profile")}
                >
                    <Avatar user={user} />
                </div>
                <div className={"block ml-auto mr-2"}>
                    <IconButton
                        className={"user-menu-button"}
                        onClick={handleClick}
                    >
                        <ChevronDownIcon className={"w-8"} />
                    </IconButton>
                    <Menu
                        className={"user-menu"}
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "right",
                        }}
                    >
                        <MenuItem onClick={toggleDrawer("left", true, "group")}>
                            <PlusIcon className={"w-4 mr-2"} />
                            {LL.CREATE_GROUP()}
                        </MenuItem>
                        <MenuItem onClick={showLanguageModal}>
                            <GlobeAltIcon className={"w-4 mr-2"} />
                            {LL.CHANGE_LANGUAGE()}
                        </MenuItem>
                        <MenuItem onClick={signOut}>
                            <ArrowRightStartOnRectangleIcon
                                className={"w-4 mr-2"}
                            />
                            {LL.SIGN_OUT()}
                        </MenuItem>
                    </Menu>
                </div>
                <Drawer
                    anchor={"left"}
                    open={drawerOpenState}
                    onClose={toggleDrawer("left", false)}
                >
                    {section === "group" && (
                        <GroupCreation
                            user={user}
                            toggleDrawer={toggleDrawer}
                        />
                    )}
                    {section === "profile" && (
                        <UserProfile toggleDrawer={toggleDrawer} />
                    )}
                </Drawer>
            </div>
            <LanguageModal modalOpen={modalOpen} setModalOpen={setModalOpen} />
        </>
    );
}
