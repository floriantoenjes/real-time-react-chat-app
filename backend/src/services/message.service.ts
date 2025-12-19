import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MessageEntity } from '../schemas/message.schema';
import { Model } from 'mongoose';
import { UserEntity } from '../schemas/user.schema';
import { UserService } from './user.service';
import { Message, MessageType } from '../../shared/message.contract';
import { SocketMessageTypes } from '../../shared/socket-message-types.enum';
import { RealTimeChatGateway } from '../gateways/socket.gateway';
import { ObjectStorageService } from './object-storage.service';
import { User } from '../../shared/user.contract';

@Injectable()
export class MessageService {
    constructor(
        private readonly gateway: RealTimeChatGateway,
        @InjectModel(MessageEntity.name)
        private readonly messageModel: Model<MessageEntity>,
        private readonly objectStorageService: ObjectStorageService,
        @InjectModel(UserEntity.name)
        private readonly userModel: Model<UserEntity>,
        private readonly userService: UserService,
    ) {}

    async getMessageById(messageId: string) {
        const message = await this.messageModel.findById(messageId).lean();

        if (!message) {
            return { status: 404 as const, body: undefined };
        }

        return { status: 200 as const, body: { message } };
    }

    async getMessages(userId: string, contactId: string) {
        const user = await this.userService.findUserBy({
            _id: userId,
        });

        if (!user) {
            return { status: 404 as const, body: false };
        }

        let messages: Message[];
        const isContactGroup = !!this.getContactGroup(user, contactId);

        if (isContactGroup) {
            messages = await this.messageModel.find({
                toUserId: contactId,
            });

            return {
                status: 200 as const,
                body: messages,
            };
        }

        messages = await this.messageModel.find({
            fromUserId: { $in: [userId, contactId] },
            toUserId: { $in: [userId, contactId] },
        });

        for (const message of messages) {
            if (!message.read && userId === message.toUserId.toString()) {
                await this.messageModel.updateOne(
                    { _id: message._id },
                    { read: true },
                );
                this.gateway
                    .prepareSendMessage(message.fromUserId)
                    ?.emit(SocketMessageTypes.messageRead, message._id);
            }
        }

        return {
            status: 200 as const,
            body: messages,
        };
    }

    async deleteMessages(fromUserId: string, toUserId: string) {
        await this.messageModel.deleteMany({
            fromUserId: fromUserId,
            toUserId: toUserId,
        });

        await this.messageModel.deleteMany({
            toUserId: fromUserId,
            fromUserId: toUserId,
        });

        return { status: 204 as const, body: true };
    }

    async sendMessage(
        fromUserId: string,
        toUserId: string,
        message: string,
        type: MessageType,
    ) {
        const newMessage = {
            fromUserId: fromUserId,
            message: message,
            toUserId: toUserId,
            at: new Date(),
            type: type,
        };

        const user = await this.userModel
            .findById(fromUserId)
            .select('+password');
        if (!user) {
            return {
                status: 404 as const,
                body: false,
            };
        }
        const newlyCreatedMessage = await this.messageModel.create(newMessage);

        const contactGroup = this.getContactGroup(user, toUserId);
        const isContact = !contactGroup;

        if (isContact) {
            this.emitMessageViaWebSocket(toUserId, newlyCreatedMessage);
        }

        if (contactGroup) {
            for (const memberId of contactGroup.memberIds) {
                this.emitMessageViaWebSocket(memberId, newlyCreatedMessage);
            }
        }

        const userContact = user.contacts.find((uc) => uc._id === toUserId);
        if (userContact) {
            userContact.lastMessage = newlyCreatedMessage._id.toString();
            user.markModified('contacts');
            void user.save();
        }

        const receiver = await this.userModel
            .findOne({ _id: toUserId })
            .select('+password');
        const receiverContact = receiver?.contacts.find(
            (c) => c._id === user._id.toString(),
        );
        if (receiver && receiverContact) {
            receiverContact.lastMessage = newlyCreatedMessage._id.toString();
            receiver.markModified('contacts');
            void receiver.save();
        }

        return { status: 201 as const, body: newlyCreatedMessage };
    }

    async markMessageRead(msgId: string) {
        const msg = await this.messageModel.findOne({
            _id: msgId,
        });
        if (!msg) {
            return { status: 404 as const };
        }
        msg.read = true;
        const updatedMsg = await msg.save();

        this.gateway
            .prepareSendMessage(updatedMsg.fromUserId)
            ?.emit(SocketMessageTypes.messageRead, updatedMsg._id);

        return { status: 200 as const, body: true };
    }

    async uploadFileAsMessage(userId: string, file: Express.Multer.File) {
        if (!(await this.userModel.findOne({ _id: userId }))) {
            return { status: 404 };
        }

        await this.objectStorageService.uploadFile(
            file.buffer,
            file.originalname,
        );

        return {
            status: 200 as const,
            body: true,
        };
    }

    private getContactGroup(user: User, contactGroupId: string) {
        return user.contactGroups.find((cg) => cg._id === contactGroupId);
    }

    private emitMessageViaWebSocket(
        userSocketId: string,
        messageToSend: Message,
    ) {
        this.gateway
            .prepareSendMessage(userSocketId)
            ?.emit(SocketMessageTypes.message, messageToSend);
    }
}
