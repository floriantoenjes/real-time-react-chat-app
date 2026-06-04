import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useI18nContext } from "../../i18n/i18n-react";

interface IgnoreConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    contactName: string;
    isIgnore?: boolean;
}

export function IgnoreConfirmationDialog({
    open,
    onClose,
    onConfirm,
    contactName,
    isIgnore = true,
}: IgnoreConfirmationDialogProps) {
    const { LL } = useI18nContext();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>
                {isIgnore ? LL.CONFIRM_IGNORE() : LL.CONFIRM_UNIGNORE()}
            </DialogTitle>
            <DialogContent>
                <p>
                    {isIgnore
                        ? LL.IGNORE_CONFIRMATION({ contactName })
                        : LL.UNIGNORE_CONFIRMATION({ username: contactName })}
                </p>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{LL.CANCEL()}</Button>
                <Button onClick={onConfirm} color="primary" autoFocus>
                    {isIgnore ? LL.IGNORE() : LL.UNIGNORE()}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
