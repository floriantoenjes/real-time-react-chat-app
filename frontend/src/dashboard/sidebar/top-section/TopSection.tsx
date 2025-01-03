import { Drawer, IconButton, Menu, MenuItem } from "@mui/material";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import "./TopSection.css";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../../../shared/Avatar";
import {
    LOCAL_STORAGE_AUTH_KEY,
    LOCAL_STORAGE_REFRESH_TOKEN,
} from "../../../environment";
import { UserProfile } from "./user-profile/UserProfile";
import { GroupCreation } from "./group-creation/GroupCreation";
import { RoutesEnum } from "../../../shared/enums/routes";

export function TopSection() {
    const navigate = useNavigate();
    const [user] = useUserContext();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const [state, setState] = useState({
        top: false,
        left: false,
        bottom: false,
        right: false,
    });

    const [section, setSection] = useState("");

    const toggleDrawer =
        (anchor: string, open: boolean, section?: string) =>
        (event: React.KeyboardEvent | React.MouseEvent) => {
            handleClose();
            if (
                event?.type === "keydown" &&
                ((event as React.KeyboardEvent).key === "Tab" ||
                    (event as React.KeyboardEvent).key === "Shift")
            ) {
                return;
            }

            setState({ ...state, [anchor]: open });

            if (section) {
                setSection(section);
            }
        };

    function signOut() {
        localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
        localStorage.removeItem(LOCAL_STORAGE_REFRESH_TOKEN);
        navigate(RoutesEnum.LOGIN);
    }

    return (
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
                >
                    <MenuItem onClick={toggleDrawer("left", true, "group")}>
                        New group
                    </MenuItem>
                    <MenuItem onClick={signOut}>Sign out</MenuItem>
                </Menu>
            </div>
            <Drawer
                anchor={"left"}
                open={state["left"]}
                onClose={toggleDrawer("left", false)}
            >
                {section === "group" && (
                    <GroupCreation user={user} toggleDrawer={toggleDrawer} />
                )}
                {section === "profile" && (
                    <UserProfile toggleDrawer={toggleDrawer} />
                )}
            </Drawer>
        </div>
    );
}
