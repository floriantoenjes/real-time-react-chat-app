import { Message, messageContract } from "@t/message.contract";
import { ClientService } from "./ClientService";

export class MessageService {
    constructor(private readonly clientService: ClientService) {}

    async getMessages(userId: string, contactId: string) {
        const messages = await this.clientService
            .getClient(messageContract)
            .getMessages({
                body: { userId, contactId },
            });

        if (messages.status !== 200) {
            throw new Error("Error getting messages");
        }

        return messages.body;
    }

    async deleteMessages(fromUserId: string, toUserId: string) {
        const res = await this.clientService
            .getClient(messageContract)
            .deleteMessages({ body: { fromUserId, toUserId } });
        if (res.status !== 200) {
            throw new Error("Error deleting messages");
        }
    }

    sendMessage(
        userIdAuthor: string,
        message: string,
        contactId: string,
        type: Message["type"],
    ) {
        return this.clientService.getClient(messageContract).sendMessage({
            body: {
                toUserId: contactId,
                message,
                fromUserId: userIdAuthor,
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

    sendFile(file: File, userId: string) {
        return this.clientService
            .getClient<typeof messageContract>(messageContract)
            .sendFile({
                body: {
                    file,
                    userId,
                },
            });
    }
}
