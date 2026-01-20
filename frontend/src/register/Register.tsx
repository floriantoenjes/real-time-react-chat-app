import { Button, IconButton, TextField } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDiContext } from "../shared/contexts/DiContext";
import { useI18nContext } from "../i18n/i18n-react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { LanguageModal } from "../dashboard/sidebar/top-section/language-modal/LanguageModal";
import { z } from "zod";
import { RoutesEnum } from "../shared/enums/routes";
import {
    SnackbarLevels,
    snackbarService,
} from "../shared/contexts/SnackbarContext";

type SignUpData = {
    email: string;
    password: string;
    passwordConfirm: string;
    username: string;
};

export function Register() {
    const { LL } = useI18nContext();
    const navigate = useNavigate();
    const authService = useDiContext().AuthService;

    const [modalOpen, setModalOpen] = useState(false);
    const locale = useI18nContext().locale;

    const [passwordsDontMatch, setPasswordsDontMatch] = useState(false);

    const { register, handleSubmit, formState } = useForm<SignUpData>();

    async function signUp(formData: SignUpData) {
        const signUpResponse = await authService.signUp(
            formData.email,
            formData.password,
            formData.username,
        );

        if (!signUpResponse) {
            return;
        }

        navigate(RoutesEnum.LOGIN);
        snackbarService.showSnackbar(LL.REGISTERED(), SnackbarLevels.SUCCESS);
    }

    return (
        <div className="h-screen flex justify-center items-center flex-col">
            <img
                src={"imgs/florians-chat.jpg"}
                width={400}
                alt={"Florians Chat logo"}
                style={{ marginLeft: "-1.5rem" }}
            />
            <div className="Login flex justify-center items-center">
                <form onSubmit={handleSubmit(signUp)} className="my-auto">
                    <div className={"flex items-center"}>
                        <h4 className="text-center">{LL.SIGN_UP()}</h4>
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
                            error={!!formState.errors.email}
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
                            helperText={formState.errors.email?.message}
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            type="password"
                            label={LL.PASSWORD()}
                            {...register("password", { required: true })}
                            className={"w-80"}
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            type="password"
                            label={LL.CONFIRM_PASSWORD()}
                            {...register("passwordConfirm", {
                                required: true,
                                validate: (value, formValues) => {
                                    const passwordsMatch =
                                        value === formValues.password;

                                    setPasswordsDontMatch(!passwordsMatch);
                                    return passwordsMatch;
                                },
                            })}
                            className={"w-80"}
                            error={passwordsDontMatch}
                            helperText={
                                passwordsDontMatch
                                    ? LL.PASSWORDS_DONT_MATCH()
                                    : ""
                            }
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            type="text"
                            label={LL.USERNAME()}
                            {...register("username", { required: true })}
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
                                {LL.SIGN_UP()}
                            </Button>
                        </span>
                        <Link to={"/"}>
                            {LL.OR()} {LL.SIGN_IN()}
                        </Link>
                    </div>
                </form>
            </div>
            <LanguageModal modalOpen={modalOpen} setModalOpen={setModalOpen} />
        </div>
    );
}
