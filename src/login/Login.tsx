import "./Login.css";
import { Button, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useHandleInputChange } from "../helpers";
import { AuthService } from "../shared/services/AuthService";
import { User } from "../shared/types/User";

export function Login(props: {
    setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
}) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "user1@email.com",
        password: "password",
    });

    function signIn() {
        const user = AuthService.signIn(formData.email, formData.password);
        if (user) {
            props.setUser(user);
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
                            value={"user1@email.com"}
                        />
                    </div>
                    <div className="mb-3">
                        <TextField
                            name="password"
                            type="password"
                            label="Password"
                            onChange={handleInputChange}
                            value={"password"}
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
