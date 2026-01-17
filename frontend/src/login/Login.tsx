import { Button, IconButton, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import React, { useState } from "react";
import { useHandleInputChange } from "../helpers";
import { useDiContext } from "../shared/contexts/DiContext";
import { RoutesEnum } from "../shared/enums/routes";
import { useI18nContext } from "../i18n/i18n-react";
import { LanguageModal } from "../dashboard/sidebar/top-section/language-modal/LanguageModal";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

export function Login(props: {}) {
    const { LL } = useI18nContext();
    const authService = useDiContext().AuthService;
    const [modalOpen, setModalOpen] = useState(false);
    const locale = useI18nContext().locale;

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    async function signIn() {
        const user = await authService.signIn(
            formData.email,
            formData.password,
        );
        if (!user) {
            return;
        }
        window.location.reload();
    }

    const handleInputChange = useHandleInputChange(setFormData);

    return (
        <div className="h-screen flex justify-center items-center flex-col">
            <img
                src={"imgs/florians-chat.jpg"}
                width={400}
                alt={"Florians Chat logo"}
                style={{ marginLeft: "-1.5rem" }}
            />
            <div className="Login flex justify-center items-center p-3">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void signIn();
                    }}
                    className="my-auto"
                >
                    <div className="flex items-center">
                        <h4 className="text-center">{LL.SIGN_IN()}</h4>
                        <div className={"ml-auto"}>
                            {locale.toUpperCase()}
                            <IconButton
                                onClick={() => setModalOpen(true)}
                                color={"primary"}
                            >
                                <GlobeAltIcon className={"w-6"} />
                            </IconButton>
                        </div>
                    </div>
                    <div className="my-3">
                        <TextField
                            name="email"
                            type="email"
                            label={LL.EMAIL()}
                            onChange={handleInputChange}
                            value={formData.email}
                            className={"w-80"}
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            name="password"
                            type="password"
                            label={LL.PASSWORD()}
                            onChange={handleInputChange}
                            value={formData.password}
                            className={"w-80"}
                        />
                    </div>

                    <div className="w-fit mx-auto">
                        <span className={"mr-3"}>
                            <Button
                                variant={"contained"}
                                autoFocus={true}
                                type={"submit"}
                            >
                                {LL.SIGN_IN()}
                            </Button>
                        </span>
                        <Link to={RoutesEnum.REGISTER}>
                            {LL.OR()} {LL.SIGN_UP()}
                        </Link>
                    </div>
                </form>
            </div>
            <LanguageModal modalOpen={modalOpen} setModalOpen={setModalOpen} />
        </div>
    );
}
