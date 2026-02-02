import { Message, messageContract } from "@t/message.contract";
import { ClientService } from "./ClientService";

export class MessageService {
    constructor(private readonly clientService: ClientService) {}

    async getMessageById(messageId: string) {
        return this.clientService.getClient(messageContract).getMessageById({
            body: {
                messageId,
            },
        });
    }

    async getMessages(contactId: string) {
        const messages = await this.clientService
            .getClient(messageContract)
            .getMessages({
                body: { contactId },
            });

        if (messages.status !== 200) {
            return false;
        }

        return messages.body;
    }

    async deleteMessages(toUserId: string) {
        const res = await this.clientService
            .getClient(messageContract)
            .deleteMessages({ body: { toUserId } });
        if (res.status !== 204) {
            return false;
        }
    }

    sendMessage(message: string, contactId: string, type: Message["type"]) {
        return this.clientService.getClient(messageContract).sendMessage({
            body: {
                toUserId: contactId,
                message,
                type,
            },
        });
    }

    setMessageRead(msgId: string) {
        return this.clientService.getClient(messageContract).markMessageRead({
            body: {
                msgId,
            },
        });
    }

    sendFile(file: File, type: "image" | "audio", toUsers: string[]) {
        return this.clientService
            .getClient<typeof messageContract>(messageContract)
            .sendFile({
                body: {
                    file,
                    type,
                    // stringified because of how ts-rest handles multipart/form-data
                    toUsers: JSON.stringify(toUsers),
                },
            });
    }
}
