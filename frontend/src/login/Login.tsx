import { Button, IconButton, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import React, { useState } from "react";
import { useDiContext } from "../shared/contexts/DiContext";
import { RoutesEnum } from "../shared/enums/routes";
import { useI18nContext } from "../i18n/i18n-react";
import { LanguageModal } from "../dashboard/sidebar/top-section/language-modal/LanguageModal";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { z } from "zod";

type SignInData = {
    email: string;
    password: string;
};

export function Login(props: {}) {
    const { LL } = useI18nContext();
    const authService = useDiContext().AuthService;
    const [modalOpen, setModalOpen] = useState(false);
    const locale = useI18nContext().locale;

    const { register, handleSubmit, formState } = useForm<SignInData>();

    async function signIn(formData: SignInData) {
        const user = await authService.signIn(
            formData.email,
            formData.password,
        );
        if (!user) {
            return;
        }
        window.location.reload();
    }

    return (
        <div className="h-screen flex justify-center items-center flex-col">
            <img
                src={"imgs/florians-chat.jpg"}
                width={400}
                alt={"Florians Chat logo"}
                style={{ marginLeft: "-1.5rem" }}
            />
            <div className="Login flex justify-center items-center p-3">
                <form onSubmit={handleSubmit(signIn)} className="my-auto">
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
                            type="email"
                            label={LL.EMAIL()}
                            {...register("email", {
                                required: true,
                                validate: (value) => {
                                    try {
                                        return !!z
                                            .string()
                                            .email()
                                            .parse(value);
                                    } catch (e) {
                                        return LL.ENTER_VALID_EMAIL();
                                    }
                                },
                            })}
                            className={"w-80"}
                        />
                    </div>
                    {formState.errors.email && (
                        <div className={"mb-8 text-red-500 text-sm"}>
                            {formState.errors.email?.message}
                        </div>
                    )}
                    <div className="mb-3">
                        <TextField
                            type="password"
                            label={LL.PASSWORD()}
                            {...register("password", {
                                required: true,
                            })}
                            className={"w-80"}
                            required={true}
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
