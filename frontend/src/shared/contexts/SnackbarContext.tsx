import React, { createContext, useState } from "react";

let snackbarRef: (message: string, type: SnackbarLevels) => void; // Singleton reference

export enum SnackbarLevels {
    SUCCESS = "success",
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
}

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
        setSnackbar({ message, type, isOpen: false });
        setTimeout(() => {
            setSnackbar({ message, type, isOpen: true });
        });
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
    showSnackbar: (
        message: string,
        type: SnackbarLevels = SnackbarLevels.INFO,
    ) => {
        if (snackbarRef) {
            snackbarRef(message, type);
        } else {
            console.warn(
                "Snackbar service not initialized. Wrap your app with SnackbarProvider.",
            );
        }
    },
};
