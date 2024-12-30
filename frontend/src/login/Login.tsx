import { Button, TextField } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { useHandleInputChange } from "../helpers";
import { UserContext } from "../shared/contexts/UserContext";
import { useDiContext } from "../shared/contexts/DiContext";
import { RoutesEnum } from "../shared/enums/routes";

export function Login(props: {}) {
    const navigate = useNavigate();
    const [, setUser] = useContext(UserContext);
    const authService = useDiContext().AuthService;

    const [formData, setFormData] = useState(
        import.meta.env.PROD
            ? {
                  email: "",
                  password: "",
              }
            : {
                  email: "florian@email.com",
                  password: "password",
              },
    );

    async function signIn() {
        const user = await authService.signIn(
            formData.email,
            formData.password,
        );
        if (user) {
            window.location.reload();
        }
    }

    const handleInputChange = useHandleInputChange(setFormData);

    return (
        <div className="h-screen flex justify-center items-center">
            <div className="Login flex justify-center items-center p-3">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void signIn();
                    }}
                    className="my-auto"
                >
                    <h4 className="text-center">Login</h4>
                    <div className="my-3">
                        <TextField
                            name="email"
                            type="email"
                            label="E-Mail"
                            onChange={handleInputChange}
                            value={formData.email}
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            name="password"
                            type="password"
                            label="Password"
                            onChange={handleInputChange}
                            value={formData.password}
                        />
                    </div>

                    <div className="w-fit mx-auto">
                        <span className={"mr-3"}>
                            <Button
                                variant={"contained"}
                                autoFocus={true}
                                type={"submit"}
                            >
                                Sign In
                            </Button>
                        </span>
                        <Link to={RoutesEnum.REGISTER}>or Sign Up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
