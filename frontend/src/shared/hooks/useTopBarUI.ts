import React, { MouseEvent, useState } from "react";

/**
 * Custom hook for managing TopBar UI state (menu and drawer)
 * @returns Object containing UI state and handlers
 */
export function useTopBarUI() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [state, setState] = useState(false);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleCloseDrawer = () => {
        // Note: setAnchorElDrawer is not used in the original code
        // Keeping for potential future use
    };

    const toggleDrawer =
        (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
            handleCloseDrawer();
            if (
                event?.type === "keydown" &&
                ((event as React.KeyboardEvent).key === "Tab" ||
                    (event as React.KeyboardEvent).key === "Shift")
            ) {
                return;
            }

            setState(open);
        };

    return {
        anchorEl,
        open,
        state,
        handleClick,
        handleClose,
        toggleDrawer,
    };
}
