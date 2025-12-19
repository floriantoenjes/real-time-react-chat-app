import {
    Body,
    Controller,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import {
    NestRequestShapes,
    TsRest,
    tsRestHandler,
    TsRestHandler,
    TsRestRequest,
} from '@ts-rest/nest';
import { messageContract } from '../../shared/message.contract';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageService } from '../services/message.service';

@Controller()
export class MessageController {
    constructor(private readonly messageService: MessageService) {}

    @TsRestHandler(messageContract.getMessageById)
    async getMessageById() {
        return tsRestHandler(
            messageContract.getMessageById,
            async ({ body }) => {
                return this.messageService.getMessageById(body.messageId);
            },
        );
    }

    @TsRestHandler(messageContract.getMessages)
    async getMessages() {
        return tsRestHandler(messageContract.getMessages, async ({ body }) => {
            return this.messageService.getMessages(body.userId, body.contactId);
        });
    }

    @TsRestHandler(messageContract.deleteMessages)
    async deleteMessages() {
        return tsRestHandler(
            messageContract.deleteMessages,
            async ({ body }) => {
                return this.messageService.deleteMessages(
                    body.fromUserId,
                    body.toUserId,
                );
            },
        );
    }

    @TsRestHandler(messageContract.sendMessage)
    async sendMessage() {
        return tsRestHandler(messageContract.sendMessage, async ({ body }) => {
            return this.messageService.sendMessage(
                body.fromUserId,
                body.toUserId,
                body.message,
                body.type,
            );
        });
    }

    @TsRestHandler(messageContract.markMessageRead)
    async markMessageRead() {
        return tsRestHandler(
            messageContract.markMessageRead,
            async ({ body }) => {
                return this.messageService.markMessageRead(body.msgId);
            },
        );
    }

    @TsRest(messageContract.sendFile)
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @TsRestRequest()
        {}: NestRequestShapes<typeof messageContract>['sendFile'],
        @UploadedFile() file: Express.Multer.File,
        @Body()
        body: {
            userId: string;
        },
    ) {
        const userId = body.userId.replaceAll('"', '');

        return this.messageService.uploadFileAsMessage(userId, file);
    }
}
