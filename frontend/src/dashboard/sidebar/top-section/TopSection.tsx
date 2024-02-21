import { Drawer, IconButton, Menu, MenuItem } from "@mui/material";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import "./TopSection.css";
import { useUserContext } from "../../../shared/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../../../shared/Avatar";
import { LOCAL_STORAGE_AUTH_KEY } from "../../../environment";
import { UserProfile } from "./user-profile/UserProfile";
import { GroupCreation } from "./group-creation/GroupCreation";

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

    return (
        <div className={"flex items-center mb-3"}>
            <div
                className={"ml-3"}
                onClick={toggleDrawer("left", true, "profile")}
            >
                <Avatar user={user} />
            </div>
            <div className={"block ml-auto mr-2"}>
                <IconButton onClick={handleClick}>
                    <ChevronDownIcon className={"w-8"} />
                </IconButton>
                <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                    <MenuItem onClick={toggleDrawer("left", true, "group")}>
                        New group
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
                            navigate("/");
                        }}
                    >
                        Sign out
                    </MenuItem>
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
