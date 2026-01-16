import {
    Controller,
    Req,
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
import { CustomLogger } from '../logging/custom-logger';
import { Request } from 'express';

@Controller()
export class MessageController {
    constructor(
        private readonly logger: CustomLogger,
        private readonly messageService: MessageService,
    ) {
        this.logger.setContext(MessageController.name);
    }

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
    async getMessages(@Req() req: Request) {
        const userId = req['user'].sub;
        return tsRestHandler(messageContract.getMessages, async ({ body }) => {
            return this.messageService.getMessages(userId, body.contactId);
        });
    }

    @TsRestHandler(messageContract.deleteMessages)
    async deleteMessages(@Req() req: Request) {
        const userId = req['user'].sub;
        return tsRestHandler(
            messageContract.deleteMessages,
            async ({ body }) => {
                return this.messageService.deleteMessages(userId, body.toUserId);
            },
        );
    }

    @TsRestHandler(messageContract.sendMessage)
    async sendMessage(@Req() req: Request) {
        const userId = req['user'].sub;
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

    @TsRest(messageContract.sendFile)
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @TsRestRequest()
        {}: NestRequestShapes<typeof messageContract>['sendFile'],
        @UploadedFile() file: Express.Multer.File,
        @Req() req: Request,
    ) {
        const userId = req['user'].sub;
        return this.messageService.uploadFileAsMessage(userId, file);
    }
}
