import { Button, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useHandleInputChange } from "../helpers";
import { useDiContext } from "../shared/contexts/DiContext";
import { RoutesEnum } from "../shared/enums/routes";
import { useI18nContext } from "../i18n/i18n-react";

export function Login(props: {}) {
    const { LL } = useI18nContext();
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
                    <h4 className="text-center">{LL.SIGN_IN()}</h4>
                    <div className="my-3">
                        <TextField
                            name="email"
                            type="email"
                            label={LL.EMAIL()}
                            onChange={handleInputChange}
                            value={formData.email}
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            name="password"
                            type="password"
                            label={LL.PASSWORD()}
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
                                {LL.SIGN_IN()}
                            </Button>
                        </span>
                        <Link to={RoutesEnum.REGISTER}>
                            {LL.OR()} {LL.SIGN_UP()}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
