import { Button, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthService } from "../shared/services/AuthService";
import { UserContext } from "../shared/contexts/UserContext";
import { useForm } from "react-hook-form";

type SignUpData = {
    email: "";
    password: "";
    passwordConfirm: "";
    username: "";
};

export function Register(props: {}) {
    const navigate = useNavigate();
    const [, setUser, userService] = useContext(UserContext);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignUpData>();

    async function signUp(formData: SignUpData) {
        const user = await AuthService.signUp(
            formData.email,
            formData.password,
            formData.username,
            userService,
        );
        if (user) {
            sessionStorage.setItem("signedIn", user.username.toLowerCase());
            setUser(user);
            navigate("/Dashboard");
        }
    }

    return (
        <div className="h-screen flex justify-center items-center">
            <div className="Login flex justify-center items-center">
                <form onSubmit={handleSubmit(signUp)} className="my-auto">
                    <h4 className="text-center">Login</h4>
                    <div className="my-3">
                        <TextField
                            type="email"
                            label="E-Mail"
                            {...register("email")}
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            type="password"
                            label="Password"
                            {...register("password")}
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            type="password"
                            label="Confirm Password"
                            {...register("passwordConfirm")}
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            type="text"
                            label="Username"
                            {...register("username")}
                        />
                    </div>

                    <div className="w-fit mx-auto">
                        <Button
                            variant={"contained"}
                            autoFocus={true}
                            type={"submit"}
                        >
                            Sign In
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
