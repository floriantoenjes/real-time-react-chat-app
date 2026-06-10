import { User, userContract } from "@t/user.contract";
import { ClientService } from "./ClientService";

export class UserService {
    constructor(private clientService: ClientService) {}

    async getSignedInUser() {
        const res = await this.clientService
            .getClient(userContract)
            .getSignedInUser({});

        if (res.status === 200) {
            return res.body;
        }

        return false;
    }

    async getUsers() {
        const res = await this.clientService.getClient(userContract).getAll({});

        if (res.status === 200) {
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
    ) {
        const res = await this.clientService
            .getClient(userContract)
            .uploadAvatar({
                // The params after "file" are expected to be numbers here (ts-rest issue)
                body: { avatar: file, x, y, width, height },
            });

        return res.status === 201;
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
