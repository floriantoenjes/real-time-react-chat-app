import {
    Controller,
    Logger,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { messageContract } from '../../shared/message.contract';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageService } from '../services/message.service';
import { UserId } from '../decorators/user-id.decorator';
import { StrictThrottle } from '../decorators/throttle.decorators';
import { MAX_FILE_SIZE_BYTES } from '../errors/external/file-too-large.exception';

@Controller()
export class MessageController {
    private readonly logger = new Logger(MessageController.name);

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
    async getMessages(@UserId() userId: string) {
        return tsRestHandler(messageContract.getMessages, async ({ body }) => {
            return this.messageService.getMessages(userId, body.contactId);
        });
    }

    @TsRestHandler(messageContract.deleteMessages)
    async deleteMessages(@UserId() userId: string) {
        return tsRestHandler(
            messageContract.deleteMessages,
            async ({ body }) => {
                return this.messageService.deleteMessages(
                    userId,
                    body.toUserId,
                );
            },
        );
    }

    @TsRestHandler(messageContract.sendMessage)
    @StrictThrottle()
    async sendMessage(@UserId() userId: string) {
        return tsRestHandler(messageContract.sendMessage, async ({ body }) => {
            return this.messageService.sendMessage(
                userId,
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

    @TsRestHandler(messageContract.sendFile)
    @UseInterceptors(
        FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }),
    )
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @UserId() userId: string,
    ) {
        return tsRestHandler(messageContract.sendFile, async ({ body }) => {
            // unwrap the type, because ts-rest wraps in extra quotes
            const type = body.type.replaceAll('"', '') as 'image' | 'audio';
            return this.messageService.uploadFileAsMessage(userId, file, type);
        });
    }
}
