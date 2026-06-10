import { UserService } from "./UserService";
import { User } from "@t/user.contract";
import React, { Dispatch, SetStateAction } from "react";
import { ClientService } from "./ClientService";
import { authContract } from "@t/auth.contract";

export class AuthService {
    public static readonly LOCAL_STORAGE_SIGNED_IN_FLAG = "signedIn";

    constructor(
        private readonly clientService: ClientService,
        private readonly userService: UserService,
    ) {}

    static setSignInData() {
        localStorage.setItem(
            AuthService.LOCAL_STORAGE_SIGNED_IN_FLAG,
            JSON.stringify(true),
        );
    }

    async signOut(callback?: () => void) {
        if (
            (await this.clientService.getClient(authContract).signOut({}))
                .status !== 204
        ) {
            return false;
        }
        localStorage.removeItem(AuthService.LOCAL_STORAGE_SIGNED_IN_FLAG);
        if (callback) {
            callback();
        }

        return true;
    }

    async signIn(email: string, password: string) {
        const res = await this.clientService
            .getClient(authContract)
            .signIn({ body: { email, password } });
        if (res.status !== 200) {
            return false;
        }

        AuthService.setSignInData();

        return res.body.authUser;
    }

    async refresh() {
        const signedIn = localStorage.getItem(
            AuthService.LOCAL_STORAGE_SIGNED_IN_FLAG,
        );
        if (!signedIn) {
            return;
        }
        const res = await this.clientService
            .getClient(authContract)
            .refresh({});
        if (res.status !== 200) {
            return;
        }
        AuthService.setSignInData();

        return res.body.authUser;
    }

    async signUp(email: string, password: string, username: string) {
        const res = await this.clientService.getClient(authContract).signUp({
            body: { email, password, username },
        });

        if (res.status !== 201) {
            return false;
        }

        AuthService.setSignInData();

        return res.body;
    }

    async authenticateUserAndFetchAvatar(
        user: User | undefined,
        setUserWithAvatarBytes: (
            setUser: React.Dispatch<React.SetStateAction<User | undefined>>,
        ) => (user: React.SetStateAction<User | undefined>) => void,
        setUser: Dispatch<SetStateAction<User | undefined>>,
    ) {
        const signedInFlagItem = localStorage.getItem(
            AuthService.LOCAL_STORAGE_SIGNED_IN_FLAG,
        );

        if (!signedInFlagItem || !JSON.parse(signedInFlagItem)) {
            return;
        }

        if (user) {
            setUserWithAvatarBytes(setUser)(user);
            return;
        }

        try {
            await this.refresh();
            const loggedInUser = await this.userService.getSignedInUser();
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
