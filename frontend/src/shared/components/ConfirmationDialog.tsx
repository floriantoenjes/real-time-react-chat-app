import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";
import { useI18nContext } from "../../i18n/i18n-react";

export interface ConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<unknown>;
    title: string;
    message: string;
    confirmLabel: string;
    /** Styles the confirm button as a destructive action. */
    destructive?: boolean;
}

/**
 * Asks the user to confirm an action before it is executed.
 * Closes itself after the action has been confirmed.
 */
export function ConfirmationDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    destructive = false,
}: ConfirmationDialogProps) {
    const { LL } = useI18nContext();

    async function handleConfirm() {
        onClose();
        await onConfirm();
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <p>{message}</p>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{LL.CANCEL()}</Button>
                <Button
                    onClick={handleConfirm}
                    color={destructive ? "error" : "primary"}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
