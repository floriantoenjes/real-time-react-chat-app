import { Link } from "react-router-dom";
import { Button, IconButton, Menu, MenuItem } from "@mui/material";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";

export function TopSection() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div className={"flex items-center"}>
            <Link to="/">
                <Button>Sign out</Button>
            </Link>
            <div className={"block ml-auto mr-2"}>
                <IconButton onClick={handleClick}>
                    <ChevronDownIcon className={"w-8"} />
                </IconButton>
                <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                    <MenuItem onClick={handleClose}>Create a group</MenuItem>
                </Menu>
            </div>
        </div>
    );
}
