import './Login.css';
import {Button, TextField} from "@mui/material";
import {useNavigate} from 'react-router-dom';

export function Login() {
    const navigate = useNavigate();
    function signIn() {
        navigate('Dashboard');
    }

    return (
        <div className="Login">
            <form onSubmit={event => {
                event.preventDefault();
                signIn();
            }}>
                <div>
                    <TextField name="email" type="email" label="E-Mail"/>
                </div>
                <div>
                    <TextField name="password" type="password" label="Password"/>
                </div>

                <Button type={'submit'}>Sign In</Button>
            </form>
        </div>
    );
}
