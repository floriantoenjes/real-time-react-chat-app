import { Button, IconButton, TextField } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import React, { useContext, useState } from "react";
import { UserContext } from "../shared/contexts/UserContext";
import { useForm } from "react-hook-form";
import { useDiContext } from "../shared/contexts/DiContext";
import { RoutesEnum } from "../shared/enums/routes";
import {
    SnackbarLevels,
    snackbarService,
} from "../shared/contexts/SnackbarContext";
import { useI18nContext } from "../i18n/i18n-react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { LanguageModal } from "../dashboard/sidebar/top-section/language-modal/LanguageModal";

type SignUpData = {
    email: "";
    password: "";
    passwordConfirm: "";
    username: "";
};

export function Register(props: {}) {
    const { LL } = useI18nContext();
    const navigate = useNavigate();
    const [, setUser] = useContext(UserContext);
    const authService = useDiContext().AuthService;

    const [modalOpen, setModalOpen] = useState(false);
    const locale = useI18nContext().locale;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignUpData>();

    async function signUp(formData: SignUpData) {
        const signUpResponse = await authService.signUp(
            formData.email,
            formData.password,
            formData.username,
        );
        if (!signUpResponse) {
            // TODO: snackbarService.showSnackbar();
            return;
        }
        setUser(signUpResponse.user);
        navigate(RoutesEnum.DASHBOARD);
        snackbarService.showSnackbar(
            LL.REGISTERED_AND_SIGNED_IN(),
            SnackbarLevels.SUCCESS,
        );
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
                            {...register("email", { required: true })}
                            className={"w-80"}
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
                                validate: (value, formValues) =>
                                    value === formValues.password,
                            })}
                            className={"w-80"}
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
