import { Controller } from '@nestjs/common';
import { RealTimeChatGateway } from '../socket.gateway';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageEntity } from '../schemas/message.schema';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { messageContract } from '../../shared/message.contract';
import { UserEntity } from '../schemas/user.schema';

@Controller()
export class MessageController {
  constructor(
    private readonly gateway: RealTimeChatGateway,
    @InjectModel(MessageEntity.name) private messageModel: Model<MessageEntity>,
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
  ) {}

  @TsRestHandler(messageContract.getMessages)
  async getMessages() {
    return tsRestHandler(messageContract.getMessages, async ({ body }) => {
      const user = await this.userModel.findOne({ _id: body.userId });
      if (!user) {
        return {
          status: 400,
          body: false,
        };
      }

      let messages = await this.messageModel.find({
        fromUserId: { $in: [body.userId, body.contactId] },
        toUserId: { $in: [body.userId, body.contactId] },
      });

      if (user.contactGroups.find((cg) => cg._id === body.contactId)) {
        messages = await this.messageModel.find({ toUserId: body.contactId });
      }

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
      const newMessageCreated = await this.messageModel.create(newMessage);

      const user = await this.userModel.findOne({ _id: body.fromUserId });
      if (!user) {
        return {
          status: 404,
          body: false,
        };
      }
      const contactGroup = user.contactGroups.find(
        (cg) => cg._id === body.toUserId,
      );

      if (!contactGroup) {
        this.gateway.connectedSocketsMap
          .get(body.toUserId)
          ?.emit('message', newMessageCreated);
      } else {
        for (const memberId of contactGroup.memberIds) {
          this.gateway.connectedSocketsMap
            .get(memberId)
            ?.emit('message', newMessageCreated);
        }
      }

      return { status: 201, body: newMessageCreated };
    });
  }
}
