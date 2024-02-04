import { Controller } from '@nestjs/common';
import { RealTimeChatGateway } from '../socket.gateway';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '../schemas/message.schema';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '../../shared/contract';

@Controller()
export class MessageController {
  constructor(
    private readonly gateway: RealTimeChatGateway,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  @TsRestHandler(contract.getMessages)
  async getMessages() {
    return tsRestHandler(contract.getMessages, async ({ body }) => {
      const messages = await this.messageModel.find({
        fromUserId: { $in: [body.userId, body.contactId] },
      });

      return {
        status: 200,
        body: messages,
      };
    });
  }

  @TsRestHandler(contract.deleteMessages)
  async deleteMessages() {
    return tsRestHandler(contract.deleteMessages, async ({ body }) => {
      await this.messageModel.deleteMany({ from: body.username });
      return { status: 200, body: true };
    });
  }

  @TsRestHandler(contract.sendMessage)
  async sendMessage() {
    return tsRestHandler(contract.sendMessage, async ({ body }) => {
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
