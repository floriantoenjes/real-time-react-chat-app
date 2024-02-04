import "./Login.css";
import { Button, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { useHandleInputChange } from "../helpers";
import { AuthService } from "../shared/services/AuthService";
import { UserContext } from "../shared/contexts/UserContext";

export function Login(props: {}) {
    const navigate = useNavigate();
    const [, setUser, userService] = useContext(UserContext);

    const [formData, setFormData] = useState({
        email: "florian@email.com",
        password: "password",
    });

    async function signIn() {
        const user = await AuthService.signIn(
            formData.email,
            formData.password,
            userService,
        );
        if (user) {
            setUser(user);
            navigate("Dashboard");
        }
    }

    const handleInputChange = useHandleInputChange(setFormData);

    return (
        <div className="h-screen flex justify-center items-center">
            <div className="Login flex justify-center items-center">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        signIn();
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
                        <Button type={"submit"}>Sign In</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
