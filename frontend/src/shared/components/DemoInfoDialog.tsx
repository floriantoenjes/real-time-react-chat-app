import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";
import { useState } from "react";
import { useI18nContext } from "../../i18n/i18n-react";
import { DEMO_MODE } from "../../environment";
import { SnackbarLevels, snackbarService } from "../contexts/SnackbarContext";

const DEMO_INFO_SEEN_KEY = "demoInfoSeen";

function hasSeenDemoInfo(): boolean {
    try {
        return localStorage.getItem(DEMO_INFO_SEEN_KEY) === "true";
    } catch {
        return false;
    }
}

function markDemoInfoSeen() {
    try {
        localStorage.setItem(DEMO_INFO_SEEN_KEY, "true");
    } catch {
        // Storage can be unavailable (private mode, blocked site data); the dialog then shows again next time.
    }
}

/**
 * Open state of the demo info dialog. Opens by itself on the first visit of the public demo.
 */
export function useDemoInfoDialog() {
    const [open, setOpen] = useState(() => DEMO_MODE && !hasSeenDemoInfo());
    return [open, setOpen] as const;
}

export function DemoInfoDialog(props: { open: boolean; onClose: () => void }) {
    const { LL } = useI18nContext();

    if (!DEMO_MODE) {
        return null;
    }

    function close() {
        markDemoInfoSeen();
        props.onClose();
    }

    async function copyAppLink() {
        try {
            await navigator.clipboard.writeText(window.location.origin);
            snackbarService.showSnackbar(
                LL.DEMO_LINK_COPIED(),
                SnackbarLevels.SUCCESS,
            );
        } catch {
            snackbarService.showSnackbar(
                window.location.origin,
                SnackbarLevels.INFO,
            );
        }
    }

    return (
        <Dialog open={props.open} onClose={close} maxWidth={"sm"}>
            <DialogTitle>{LL.DEMO_INFO_TITLE()}</DialogTitle>
            <DialogContent>
                <ul className={"list-disc pl-5 space-y-2"}>
                    <li>{LL.DEMO_INFO_EMAIL()}</li>
                    <li>{LL.DEMO_INFO_SECOND_WINDOW()}</li>
                    <li>{LL.DEMO_INFO_PERSONAS()}</li>
                    <li>{LL.DEMO_INFO_RESET()}</li>
                </ul>
            </DialogContent>
            <DialogActions>
                <Button onClick={copyAppLink}>
                    {LL.DEMO_INFO_COPY_LINK()}
                </Button>
                <Button variant={"contained"} onClick={close}>
                    {LL.DEMO_INFO_GOT_IT()}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
