import { Avatar } from "../../shared/Avatar";
import {
    ChevronDownIcon,
    MagnifyingGlassIcon,
    PhoneIcon,
    VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { Button, IconButton, Menu, MenuItem } from "@mui/material";
import { useState } from "react";

export function Chat() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div className={"w-full"}>
            <div
                className={
                    "flex items-center border w-full p-2 justify-between"
                }
            >
                <div className={"flex items-center"}>
                    <Avatar />
                    <p>Debora</p>
                </div>
                <div className={"flex"}>
                    <VideoCameraIcon className={"w-6 mr-3"} />
                    <PhoneIcon className={"w-6 mr-3"} />
                    <MagnifyingGlassIcon className={"w-6"} />
                    <IconButton
                        id="basic-button"
                        aria-controls={open ? "basic-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? "true" : undefined}
                        onClick={handleClick}
                    >
                        <ChevronDownIcon className={"w-8"} />
                    </IconButton>
                    <Menu
                        id="basic-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                            "aria-labelledby": "basic-button",
                        }}
                    >
                        <MenuItem onClick={handleClose}>Chat leeren</MenuItem>
                        <MenuItem onClick={handleClose}>Chat löschen</MenuItem>
                    </Menu>
                </div>
            </div>
        </div>
    );
}
