import { Box, Button, MenuItem, Modal, Select } from "@mui/material";
import React from "react";
import { useI18nContext } from "../../../../i18n/i18n-react";
import { loadLocaleAsync } from "../../../../i18n/i18n-util.async";
import { Locales } from "../../../../i18n/i18n-types";

export function LanguageModal(props: {
    modalOpen: boolean;
    setModalOpen: (open: boolean) => void;
}) {
    const { LL, locale, setLocale } = useI18nContext();

    const style = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 400,
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
    };

    return (
        <Modal
            open={props.modalOpen}
            onClose={() => props.setModalOpen(false)}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <h2 className={"text-xl mb-4 text-center"}>
                    {LL.CHANGE_LANGUAGE()}
                </h2>
                <Select
                    className={"w-full"}
                    value={locale}
                    onChange={(event) => {
                        const selectedLocale = event.target.value as Locales;
                        loadLocaleAsync(selectedLocale).then(() => {
                            setLocale(selectedLocale);
                            localStorage.setItem("language", selectedLocale);
                        });
                    }}
                >
                    <MenuItem value={"en"} className={"w-full"}>
                        English
                    </MenuItem>
                    <MenuItem value={"de"} className={"w-full"}>
                        Deutsch
                    </MenuItem>
                </Select>
                <div className={"mt-4 mx-auto w-fit"}>
                    <Button
                        variant={"contained"}
                        className={"mx-auto"}
                        onClick={() => props.setModalOpen(false)}
                    >
                        {LL.CLOSE()}
                    </Button>
                </div>
            </Box>
        </Modal>
    );
}
