import {
  Body,
  Controller,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { RealTimeChatGateway } from '../socket.gateway';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageEntity } from '../schemas/message.schema';
import {
  NestRequestShapes,
  TsRest,
  tsRestHandler,
  TsRestHandler,
  TsRestRequest,
} from '@ts-rest/nest';
import { Message, messageContract } from '../../shared/message.contract';
import { UserEntity } from '../schemas/user.schema';
import { UserService } from '../services/user.service';
import { User } from '../../shared/user.contract';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectStorageService } from '../services/object-storage.service';

@Controller()
export class MessageController {
  constructor(
    private readonly gateway: RealTimeChatGateway,
    @InjectModel(MessageEntity.name) private messageModel: Model<MessageEntity>,
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    private readonly userService: UserService,
    private readonly objectStorageService: ObjectStorageService,
  ) {}

  @TsRestHandler(messageContract.getMessages)
  async getMessages() {
    return tsRestHandler(messageContract.getMessages, async ({ body }) => {
      const userResponse = await this.userService.findUserBy({
        _id: body.userId,
      });

      if (!userResponse.body) {
        return userResponse;
      }

      const user = userResponse.body;

      let messages: Message[];
      const isContactGroup = !!this.getContactGroup(user, body.contactId);

      if (isContactGroup) {
        messages = await this.messageModel.find({ toUserId: body.contactId });

        return {
          status: 200,
          body: messages,
        };
      }

      messages = await this.messageModel.find({
        fromUserId: { $in: [body.userId, body.contactId] },
        toUserId: { $in: [body.userId, body.contactId] },
      });

      for (const message of messages) {
        if (!message.read && body.userId === message.toUserId.toString()) {
          await this.messageModel.updateOne(
            { _id: message._id },
            { read: true },
          );
          this.gateway
            .prepareSendMessage(message.fromUserId)
            ?.emit('messageRead', message._id);
        }
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

      await this.messageModel.deleteMany({
        toUserId: body.fromUserId,
        fromUserId: body.toUserId,
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
        type: body.type,
      };

      const user = await this.userModel
        .findById(body.fromUserId)
        .select('+password');
      if (!user) {
        return {
          status: 404,
          body: false,
        };
      }
      const newlyCreatedMessage = await this.messageModel.create(newMessage);

      const contactGroup = this.getContactGroup(user, body.toUserId);
      const isContact = !contactGroup;

      if (isContact) {
        this.emitMessageViaWebSocket(body.toUserId, newlyCreatedMessage);
      }

      if (contactGroup) {
        for (const memberId of contactGroup.memberIds) {
          this.emitMessageViaWebSocket(memberId, newlyCreatedMessage);
        }
      }

      const userContact = user.contacts.find((uc) => uc._id === body.toUserId);
      if (userContact) {
        userContact.lastMessage = newlyCreatedMessage;
        user.markModified('contacts');
        void user.save();
      }

      const receiver = await this.userModel
        .findOne({ _id: body.toUserId })
        .select('+password');
      const receiverContact = receiver?.contacts.find(
        (c) => c._id === user._id.toString(),
      );
      if (receiver && receiverContact) {
        receiverContact.lastMessage = newlyCreatedMessage;
        receiver.markModified('contacts');
        void receiver.save();
      }

      return { status: 201, body: newlyCreatedMessage };
    });
  }

  @TsRestHandler(messageContract.markMessageRead)
  async markMessageRead() {
    return tsRestHandler(messageContract.markMessageRead, async ({ body }) => {
      const msg = await this.messageModel.findOne({ _id: body.msgId });
      if (!msg) {
        return { status: 404 };
      }
      msg.read = true;
      const updatedMsg = await msg.save();

      this.gateway
        .prepareSendMessage(updatedMsg.fromUserId)
        ?.emit('messageRead', updatedMsg._id);

      return { status: 200, body: true };
    });
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
    body.userId = body.userId.replaceAll('"', '');

    if (!(await this.userModel.findOne({ _id: body.userId }))) {
      return { status: 404 };
    }

    await this.objectStorageService.uploadFile(file.buffer, file.originalname);

    return {
      status: 200 as const,
      body: true,
    };
  }

  private emitMessageViaWebSocket(
    userSocketId: string,
    messageToSend: Message,
  ) {
    this.gateway
      .prepareSendMessage(userSocketId)
      ?.emit('message', messageToSend);
  }

  private getContactGroup(user: User, contactGroupId: string) {
    return user.contactGroups.find((cg) => cg._id === contactGroupId);
  }
}
