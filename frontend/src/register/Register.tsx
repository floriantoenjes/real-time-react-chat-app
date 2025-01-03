import { Button, TextField } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../shared/contexts/UserContext";
import { useForm } from "react-hook-form";
import { useDiContext } from "../shared/contexts/DiContext";
import { RoutesEnum } from "../shared/enums/routes";
import {
    LOCAL_STORAGE_AUTH_KEY,
    LOCAL_STORAGE_REFRESH_TOKEN,
} from "../environment";

type SignUpData = {
    email: "";
    password: "";
    passwordConfirm: "";
    username: "";
};

export function Register(props: {}) {
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
        }
    }

    return (
        <div className="h-screen flex justify-center items-center">
            <div className="Login flex justify-center items-center">
                <form onSubmit={handleSubmit(signUp)} className="my-auto">
                    <h4 className="text-center">Register</h4>
                    <div className="my-3">
                        <TextField
                            type="email"
                            label="E-Mail"
                            {...register("email", { required: true })}
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            type="password"
                            label="Password"
                            {...register("password", { required: true })}
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            type="password"
                            label="Confirm Password"
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
                            label="Username"
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
                                Sign Up
                            </Button>
                        </span>
                        <Link to={"/"}>or Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
