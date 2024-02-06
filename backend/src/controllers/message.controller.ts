import { Controller } from '@nestjs/common';
import { RealTimeChatGateway } from '../socket.gateway';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '../schemas/message.schema';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { messageContract } from '../../shared/message.contract';

@Controller()
export class MessageController {
  constructor(
    private readonly gateway: RealTimeChatGateway,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  @TsRestHandler(messageContract.getMessages)
  async getMessages() {
    return tsRestHandler(messageContract.getMessages, async ({ body }) => {
      const messages = await this.messageModel.find({
        fromUserId: { $in: [body.userId, body.contactId] },
        toUserId: { $in: [body.userId, body.contactId] },
      });

      return {
        status: 200,
        body: messages,
      };
    });
  }

  @TsRestHandler(messageContract.deleteMessages)
  async deleteMessages() {
    return tsRestHandler(messageContract.deleteMessages, async ({ body }) => {
      await this.messageModel.deleteMany({
        fromUserId: body.fromUserId,
        toUserId: body.toUserId,
      });
      return { status: 200, body: true };
    });
  }

  @TsRestHandler(messageContract.sendMessage)
  async sendMessage() {
    return tsRestHandler(messageContract.sendMessage, async ({ body }) => {
      const newMessage = {
        fromUserId: body.fromUserId,
        message: body.message,
        toUserId: body.toUserId,
        at: new Date(),
      };
      await this.messageModel.create(newMessage);

      this.gateway.connectedSocketsMap
        .get(body.toUserId)
        ?.emit('message', newMessage);

      return { status: 201, body: true };
    });
  }
}
