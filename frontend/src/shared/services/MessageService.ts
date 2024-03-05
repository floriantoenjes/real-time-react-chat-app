import { messageContract } from "@t/message.contract";
import { ClientService } from "./ClientService";

export class MessageService {
    constructor(private readonly clientService: ClientService) {}

    async getMessages(userId: string, contactId: string) {
        const messages = await this.clientService
            .getClient(messageContract)
            .getMessages({
                body: { userId, contactId },
            });

        if (messages.status === 200) {
            return messages.body;
        }

        return [];
    }

    deleteMessages(fromUserId: string, toUserId: string) {
        void this.clientService
            .getClient(messageContract)
            .deleteMessages({ body: { fromUserId, toUserId } });
    }

    sendMessage(userIdAuthor: string, message: string, contactId: string) {
        return this.clientService.getClient(messageContract).sendMessage({
            body: {
                toUserId: contactId,
                message,
                fromUserId: userIdAuthor,
            },
        });
    }
}
