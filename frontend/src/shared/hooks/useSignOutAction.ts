import { RoutesEnum } from "../enums/routes";
import { SnackbarLevels, snackbarService } from "../contexts/SnackbarContext";
import { useContext } from "react";
import { SocketContext } from "../contexts/SocketContext";
import { useDiContext } from "../contexts/DiContext";
import { useI18nContext } from "../../i18n/i18n-react";
import { useNavigate } from "react-router-dom";

export function useSignOutAction() {
    const [socket] = useContext(SocketContext);
    const authService = useDiContext().AuthService;
    const navigate = useNavigate();
    const { LL } = useI18nContext();

    function signOut() {
        void authService
            .signOut(() => {
                socket?.off("disconnect");
                socket?.disconnect();
                navigate(RoutesEnum.LOGIN);
            })
            .then((logoutSuccess) => {
                if (!logoutSuccess) {
                    return snackbarService.showSnackbar(
                        LL.ERROR.COULD_NOT_LOGOUT(),
                        SnackbarLevels.ERROR,
                    );
                }

                snackbarService.showSnackbar(
                    LL.LOGGED_OUT(),
                    SnackbarLevels.SUCCESS,
                );
            });
    }

    return { signOut };
}