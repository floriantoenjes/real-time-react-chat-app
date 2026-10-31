import { useI18nContext } from "../../i18n/i18n-react";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface IgnoreConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<unknown>;
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
        <ConfirmationDialog
            open={open}
            onClose={onClose}
            onConfirm={onConfirm}
            title={isIgnore ? LL.CONFIRM_IGNORE() : LL.CONFIRM_UNIGNORE()}
            message={
                isIgnore
                    ? LL.IGNORE_CONFIRMATION({ contactName })
                    : LL.UNIGNORE_CONFIRMATION({ username: contactName })
            }
            confirmLabel={isIgnore ? LL.IGNORE() : LL.UNIGNORE()}
        />
    );
}
