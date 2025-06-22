import { UserService } from "./UserService";
import { SnackbarLevels, snackbarService } from "../contexts/SnackbarContext";
import { User } from "@t/user.contract";
import React, { Dispatch, SetStateAction } from "react";

export class AuthService {
    public static readonly LOCAL_STORAGE_SIGNED_IN_FLAG = "signedIn";

    constructor(private readonly userService: UserService) {}

    static setSignInData() {
        localStorage.setItem(
            AuthService.LOCAL_STORAGE_SIGNED_IN_FLAG,
            JSON.stringify(true),
        );
    }

    async signOut(callback?: () => void) {
        if (!(await this.userService.signOut())) {
            return false;
        }
        localStorage.removeItem(AuthService.LOCAL_STORAGE_SIGNED_IN_FLAG);
        if (callback) {
            callback();
        }
        return true;
    }

    async signIn(email: string, password: string) {
        const body = await this.userService.signIn(email, password);
        if (!body) {
            return;
        }

        AuthService.setSignInData();

        return body.user;
    }

    async refresh() {
        const signedIn = localStorage.getItem(
            AuthService.LOCAL_STORAGE_SIGNED_IN_FLAG,
        );
        if (!signedIn) {
            return;
        }
        const res = await this.userService.refresh();
        if (!res) {
            return;
        }
        AuthService.setSignInData();

        return res.user;
    }

    async signUp(email: string, password: string, username: string) {
        return this.userService.signUp(email, password, username);
    }

    async authenticateUserAndFetchAvatar(
        user: User | undefined,
        setUserWithAvatarBytes: (
            setUser: React.Dispatch<React.SetStateAction<User | undefined>>,
        ) => (user: React.SetStateAction<User | undefined>) => void,
        setUser: Dispatch<SetStateAction<User | undefined>>,
    ) {
        const hasAnAuthToken = localStorage.getItem(
            AuthService.LOCAL_STORAGE_SIGNED_IN_FLAG,
        );

        if (user) {
            setUserWithAvatarBytes(setUser)(user);
            return;
        }

        if (!hasAnAuthToken) {
            return;
        }

        try {
            const loggedInUser = await this.refresh();
            if (loggedInUser) {
                setUserWithAvatarBytes(setUser)(loggedInUser);
                return;
            }

            if (!loggedInUser) {
                void this.signOut();
            }
        } catch (e) {
            void this.signOut();
        }
    }
}
