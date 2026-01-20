import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MessageEntity } from '../schemas/message.schema';
import { Model } from 'mongoose';
import { UserEntity } from '../schemas/user.schema';
import { UserService } from './user.service';
import { Message, MessageType } from '../../shared/message.contract';
import { SocketMessageTypes } from '../../shared/socket-message-types.enum';
import { RealTimeChatGateway } from '../gateways/socket.gateway';
import { ObjectStorageService } from './object-storage.service';
import { ContactGroupEntity } from '../schemas/contact-group.schema';
import { MessageNotFoundException } from '../errors/internal/message-not-found.exception';
import { UserNotFoundException } from '../errors/internal/user-not-found.exception';

@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);

    constructor(
        @InjectModel(ContactGroupEntity.name)
        private readonly contactGroupModel: Model<ContactGroupEntity>,
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
            this.logger.warn(
                `Get message failed: message ${messageId} not found`,
            );
            throw new MessageNotFoundException();
        }

        return { status: 200 as const, body: { message } };
    }

    async getMessages(userId: string, contactId: string) {
        const user = await this.userService.findUserBy({
            _id: userId,
        });

        if (!user) {
            this.logger.warn(`Get messages failed: user ${userId} not found`);
            throw new UserNotFoundException();
        }

        let messages: Message[];
        const contactGroup = await this.getContactGroup(contactId);

        if (contactGroup) {
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
            this.logger.warn(
                `Send message failed: sender ${fromUserId} not found`,
            );
            throw new UserNotFoundException();
        }
        const newlyCreatedMessage = await this.messageModel.create(newMessage);

        const contactGroup = await this.getContactGroup(toUserId);
        const isContact = !contactGroup;

        if (isContact) {
            this.emitMessageViaWebSocket(toUserId, newlyCreatedMessage);
        }

        if (contactGroup) {
            // Send to all members except the sender
            for (const memberId of contactGroup.memberIds) {
                if (memberId !== fromUserId) {
                    this.emitMessageViaWebSocket(memberId, newlyCreatedMessage);
                }
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
            this.logger.warn(
                `Mark message read failed: message ${msgId} not found`,
            );
            throw new MessageNotFoundException();
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
            this.logger.warn(`Upload file failed: user ${userId} not found`);
            throw new UserNotFoundException();
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

    private async getContactGroup(
        contactGroupId: string,
    ): Promise<ContactGroupEntity | null> {
        return this.contactGroupModel.findOne({ _id: contactGroupId }).lean();
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
