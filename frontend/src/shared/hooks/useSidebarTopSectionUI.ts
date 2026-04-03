import React, { useState } from "react";

export function useSidebarTopSectionUI() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const [drawerOpenState, setDrawerOpenState] = useState(false);

    const [section, setSection] = useState("");

    const [modalOpen, setModalOpen] = useState(false);

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

            setDrawerOpenState(open);

            if (section) {
                setSection(section);
            }
        };

    function showLanguageModal() {
        setModalOpen(true);
    }

    return {
        toggleDrawer,
        handleClick,
        handleClose,
        showLanguageModal,
        anchorEl,
        open,
        drawerOpenState,
        section,
        modalOpen,
        setModalOpen,
    };
}
