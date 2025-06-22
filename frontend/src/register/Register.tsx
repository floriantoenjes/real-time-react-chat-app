import { Button, TextField } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../shared/contexts/UserContext";
import { useForm } from "react-hook-form";
import { useDiContext } from "../shared/contexts/DiContext";
import { RoutesEnum } from "../shared/enums/routes";
import {
    SnackbarLevels,
    snackbarService,
} from "../shared/contexts/SnackbarContext";
import { useI18nContext } from "../i18n/i18n-react";

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

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignUpData>();

    async function signUp(formData: SignUpData) {
        const signUpResponse = await authService.signUp(
            formData.email,
            formData.password,
            formData.username,
        );
        if (signUpResponse) {
            setUser(signUpResponse.user);
            navigate(RoutesEnum.DASHBOARD);
            snackbarService.showSnackbar(
                LL.REGISTERED_AND_SIGNED_IN(),
                SnackbarLevels.SUCCESS,
            );
        }
    }

    return (
        <div className="h-screen flex justify-center items-center">
            <div className="Login flex justify-center items-center">
                <form onSubmit={handleSubmit(signUp)} className="my-auto">
                    <h4 className="text-center">{LL.SIGN_UP()}</h4>
                    <div className="my-3">
                        <TextField
                            type="email"
                            label={LL.EMAIL()}
                            {...register("email", { required: true })}
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            type="password"
                            label={LL.PASSWORD()}
                            {...register("password", { required: true })}
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
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            type="text"
                            label={LL.USERNAME()}
                            {...register("username", { required: true })}
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
        </div>
    );
}
