import { User, userContract } from "@t/user.contract";
import { ClientService } from "./ClientService";
import { AuthService } from "./AuthService";

export class UserService {
    constructor(private clientService: ClientService) {}

    async getUsers() {
        const res = await this.clientService.getClient(userContract).getAll();

        if (res.status === 200) {
            return res.body;
        }

        return false;
    }

    async signIn(email: string, password: string) {
        const res = await this.clientService.getClient(userContract).signIn({
            body: { email, password },
        });

        if (res.status === 200) {
            return res.body;
        }

        return false;
    }

    async refresh(
        accessToken: string,
    ): Promise<
        { user: User; accessToken: string; refreshToken: string } | false
    > {
        const res = await this.clientService
            .getClient(userContract)
            .refresh({ body: { accessToken } });

        if (res.status === 200) {
            return res.body;
        }

        return false;
    }

    async signUp(email: string, password: string, username: string) {
        const res = await this.clientService.getClient(userContract).signUp({
            body: { email, password, username },
        });

        if (res.status === 201) {
            AuthService.setSignInData(
                res.body.accessToken,
                res.body.refreshToken,
            );

            return res.body;
        }

        return false;
    }

    async searchForUserByUsername(username: string): Promise<User | false> {
        const res = await this.clientService
            .getClient(userContract)
            .searchUserByUsername({
                body: { username },
            });

        if (res.status === 200) {
            return res.body;
        }

        return false;
    }

    async uploadAvatar(
        file: File,
        x: number,
        y: number,
        width: number,
        height: number,
        userId: string,
    ) {
        await this.clientService.getClient(userContract).uploadAvatar({
            body: { avatar: file, userId, x, y, width, height },
        });
    }

    async loadAvatar(userId: string) {
        const res = (await this.clientService
            .getClient(userContract)
            .loadAvatar({
                params: { userId },
            })) as any;

        return btoa(
            new Uint8Array(Object.values(res.body)).reduce(function (
                data,
                byte,
            ) {
                return data + String.fromCharCode(byte);
            }, ""),
        );
    }
}
