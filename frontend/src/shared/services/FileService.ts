import { ClientService } from "./ClientService";
import { fileContract } from "@t/file.contract";

export class FileService {
    constructor(private clientService: ClientService) {}

    async loadImage(userId: string, fileName: string) {
        const res = (await this.clientService
            .getClient(fileContract)
            .loadFile({ body: { userId, fileName } })) as any;

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
