import React, { createContext, useState, useContext } from "react";

let snackbarRef: (
    message: string,
    type: "success" | "info" | "warning" | "error",
) => void; // Singleton reference

export type SnackbarLevels = "success" | "info" | "warning" | "error";

export const SnackbarContext = createContext({
    snackbar: {
        message: "",
        type: "info" as SnackbarLevels,
        isOpen: false,
    },
    showSnackbar: (message: string, type: SnackbarLevels) => {},
    hideSnackbar: () => {},
});

export const SnackbarProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [snackbar, setSnackbar] = useState({
        message: "",
        type: "info" as SnackbarLevels,
        isOpen: false,
    });

    const showSnackbar = (message: string, type: SnackbarLevels) => {
        setSnackbar({ message, type, isOpen: true });

        // Auto-hide snackbar after 3 seconds
        setTimeout(() => {
            setSnackbar((prev) => ({ ...prev, isOpen: false }));
        }, 6000);
    };

    const hideSnackbar = () =>
        setSnackbar((prev) => ({ ...prev, isOpen: false }));

    // Assign the `showSnackbar` function to the global reference
    snackbarRef = showSnackbar;

    return (
        <SnackbarContext.Provider
            value={{ snackbar, showSnackbar, hideSnackbar }}
        >
            {children}
        </SnackbarContext.Provider>
    );
};

// Global snackbar service singleton
export const snackbarService = {
    showSnackbar: (message: string, type: SnackbarLevels = "info") => {
        if (snackbarRef) {
            snackbarRef(message, type);
        } else {
            console.warn(
                "Snackbar service not initialized. Wrap your app with SnackbarProvider.",
            );
        }
    },
};
