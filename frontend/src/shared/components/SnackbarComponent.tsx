import React from "react";
import { useContext } from "react";
import { SnackbarContext } from "../contexts/SnackbarContext";
import { Alert, Snackbar } from "@mui/material";

export const SnackbarWrapper = () => {
    const { snackbar, hideSnackbar } = useContext(SnackbarContext);

    return (
        <Snackbar
            open={snackbar.isOpen}
            autoHideDuration={6000}
            onClose={hideSnackbar}
            ClickAwayListenerProps={{ onClickAway: () => null }}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
            <Alert
                onClose={hideSnackbar}
                severity={snackbar.type}
                variant="filled"
                sx={{ width: "100%" }}
            >
                {snackbar.message}
            </Alert>
        </Snackbar>
    );
};
