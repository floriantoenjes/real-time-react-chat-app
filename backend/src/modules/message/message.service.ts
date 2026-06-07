import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MessageEntity } from './message.schema';
import { HydratedDocument, Model } from 'mongoose';
import { UserEntity } from '../user/user.schema';
import { Message, MessageType } from '../../../shared/message.contract';
import { ObjectStorageService } from '../global/object-storage.service';
import { ContactGroupEntity } from '../contact-group/contact-group.schema';
import { MessageNotFoundException } from '../../errors/internal/message-not-found.exception';
import { UserNotFoundException } from '../../errors/internal/user-not-found.exception';
import {
    validateAndSanitizeAudioFile,
    validateAndSanitizeImageFile,
    ValidatedFile,
} from '../../utils/file-validation.util';
import { FileAccessEntity } from '../file/file-access.schema';
import { ContactGroup } from '../../../shared/contact-group.contract';
import { ContactNotFoundException } from '../../errors/internal/contact-not-found.exception';
import { UserRelationshipQueryService } from '../user-relationship-query/user-relationship-query.service';
import { UserIsIgnoredException } from '../../errors/external/user-is-ignored.exception';
import { EventBusService } from '../global/event-bus.service';
import { EventNames } from '../../events/event-names.enum';
import {
    MessageReadEvent,
    MessageSentEvent,
} from '../../events/message.events';
import {
    ContactAutoAddEvent,
    ContactGroupAutoAddEvent,
} from '../../events/contact.events';

@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);

    constructor(
        @InjectModel(ContactGroupEntity.name)
        private readonly contactGroupModel: Model<ContactGroupEntity>,
        @InjectModel(FileAccessEntity.name)
        private readonly fileAccessModel: Model<FileAccessEntity>,
        @InjectModel(MessageEntity.name)
        private readonly messageModel: Model<MessageEntity>,
        @InjectModel(UserEntity.name)
        private readonly userModel: Model<UserEntity>,
        private readonly objectStorageService: ObjectStorageService,
        private readonly userRelationshipQueryService: UserRelationshipQueryService,
        private readonly eventBus: EventBusService,
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
        const user = await this.userModel.findOne({
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
                owners: userId,
            });

            return {
                status: 200 as const,
                body: messages,
            };
        }

        messages = await this.messageModel.find({
            fromUserId: { $in: [userId, contactId] },
            toUserId: { $in: [userId, contactId] },
            owners: userId,
        });

        for (const message of messages) {
            if (!message.read && userId === message.toUserId.toString()) {
                await this.messageModel.updateOne(
                    { _id: message._id },
                    { read: true },
                );
                this.eventBus.emitAsync<MessageReadEvent>(
                    EventNames.MESSAGE_READ,
                    {
                        messageId: message._id.toString(),
                        messageAuthorId: userId,
                    },
                );
            }
        }

        return {
            status: 200 as const,
            body: messages,
        };
    }

    async deleteMessages(fromUserId: string, toUserId: string) {
        await this.deleteLastContactMessage(fromUserId, toUserId);
        await this.deleteLastContactMessage(toUserId, fromUserId);

        const toUserIdIsContactGroupId = !!(await this.contactGroupModel
            .findById(toUserId)
            .lean());

        let affectedMessages: HydratedDocument<MessageEntity>[];
        if (toUserIdIsContactGroupId) {
            affectedMessages = await this.messageModel.find({
                toUserId,
                owners: fromUserId,
            });
        } else {
            affectedMessages = await this.messageModel.find({
                fromUserId: { $in: [fromUserId, toUserId] },
                toUserId: { $in: [toUserId, fromUserId] },
            });
        }

        for (const message of affectedMessages) {
            message.owners = message.owners.filter(
                (owner) => owner !== fromUserId,
            );

            if (message.owners.length === 0) {
                await message.deleteOne();
                continue;
            }

            message.markModified('owners');
            await message.save();
        }

        return { status: 204 as const, body: true };
    }

    private async deleteLastContactMessage(
        fromUserId: string,
        toUserId: string,
    ) {
        const fromUser = await this.userModel.findById(fromUserId);
        if (!fromUser) {
            return;
        }
        const fromContact = fromUser.contacts.find(
            (contact) => contact._id === toUserId,
        );
        if (!fromContact) {
            return;
        }
        fromContact.lastMessage = undefined;
        fromUser.markModified('contacts');

        await fromUser.save();
    }

    async sendMessage(
        fromUserId: string,
        toUserId: string,
        message: string,
        type: MessageType,
    ) {
        // Check if sender has ignored the receiver
        const isIgnored = await this.userRelationshipQueryService.isUserIgnored(
            fromUserId,
            toUserId,
        );
        if (isIgnored) {
            this.logger.warn(
                `User ${fromUserId} tried to send message to ignored user ${toUserId}`,
            );
            throw new UserIsIgnoredException();
        }

        const newMessage = {
            fromUserId: fromUserId,
            message: message,
            toUserId: toUserId,
            at: new Date(),
            type: type,
            owners: [fromUserId, toUserId],
        } satisfies Omit<Message, '_id' | 'sent' | 'read'>;

        const sender = await this.userModel
            .findById(fromUserId)
            .select('+password');
        if (!sender) {
            this.logger.warn(
                `Send message failed: sender ${fromUserId} not found`,
            );
            throw new UserNotFoundException();
        }
        const receiver = await this.userModel
            .findById(toUserId)
            .select('+password');

        const contactGroup = await this.getContactGroup(toUserId);
        const isNotContactGroup = !contactGroup;

        if (contactGroup) {
            newMessage.owners = contactGroup.memberRefs.map(
                (memberRef) => memberRef.memberId,
            );
        }

        const newlyCreatedMessage = await this.messageModel.create(newMessage);

        if (isNotContactGroup) {
            this.eventBus.emitAsync<ContactAutoAddEvent>(
                EventNames.CONTACT_AUTO_ADD,
                {
                    userId: toUserId,
                    contactUserId: fromUserId,
                },
            );
            this.eventBus.emitAsync<MessageSentEvent>(EventNames.MESSAGE_SENT, {
                message: newlyCreatedMessage,
                recipientId: toUserId,
            });
        } else if (contactGroup) {
            contactGroup.lastMessage = newlyCreatedMessage._id;
            await this.contactGroupModel.updateOne(
                { _id: contactGroup._id },
                contactGroup,
            );

            // Emit event for each group member except sender
            for (const memberRef of contactGroup.memberRefs) {
                if (memberRef.memberId === fromUserId) {
                    continue;
                }

                this.eventBus.emitAsync<ContactGroupAutoAddEvent>(
                    EventNames.CONTACT_GROUP_AUTO_ADD,
                    {
                        userId: memberRef.memberId,
                        group: {
                            ...contactGroup,
                            _id: contactGroup._id.toString(),
                            name: contactGroup.memberRefs
                                .filter(
                                    (m) => m.memberId !== memberRef.memberId,
                                )
                                .map((m) => m.memberName)
                                .join(', '),
                        } as ContactGroup,
                    },
                );

                this.eventBus.emitAsync<MessageSentEvent>(
                    EventNames.MESSAGE_SENT,
                    {
                        message: newlyCreatedMessage,
                        recipientId: memberRef.memberId,
                    },
                );
            }
        } else {
            throw new ContactNotFoundException();
        }

        this.persistLastMessageForSender(sender, toUserId, newlyCreatedMessage);

        const receiverContact = receiver?.contacts.find(
            (c) => c._id === sender._id.toString(),
        );
        if (receiver && receiverContact) {
            receiverContact.lastMessage = newlyCreatedMessage._id.toString();
            receiver.markModified('contacts');
            void receiver.save();
        }

        return { status: 201 as const, body: newlyCreatedMessage };
    }

    private persistLastMessageForSender(
        sender: HydratedDocument<UserEntity>,
        toUserId: string,
        message: Message,
    ) {
        const userContact = sender.contacts.find((uc) => uc._id === toUserId);
        if (userContact) {
            userContact.lastMessage = message._id.toString();
            sender.markModified('contacts');
            void sender.save();
        }
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

        this.eventBus.emitAsync<MessageReadEvent>(EventNames.MESSAGE_READ, {
            messageId: updatedMsg._id.toString(),
            messageAuthorId: updatedMsg.fromUserId.toString(),
        });

        return { status: 200 as const, body: true };
    }

    async uploadFileAsMessage(
        userId: string,
        file: Express.Multer.File,
        type: 'image' | 'audio',
        toUsers: string[],
    ) {
        if (!(await this.userModel.findOne({ _id: userId }))) {
            this.logger.warn(`Upload file failed: user ${userId} not found`);
            throw new UserNotFoundException();
        }

        let validatedFile: ValidatedFile;
        switch (type) {
            case 'image':
                validatedFile = await validateAndSanitizeImageFile(file);
                break;
            case 'audio':
                validatedFile = await validateAndSanitizeAudioFile(file);
                break;
        }

        await this.objectStorageService.uploadFile(
            validatedFile.buffer,
            validatedFile.sanitizedFilename,
        );

        await this.fileAccessModel.create({
            ownerId: userId,
            accessibleBy: [userId, ...toUsers],
            storageId: validatedFile.sanitizedFilename,
        });

        return {
            status: 201 as const,
            body: validatedFile.sanitizedFilename,
        };
    }

    private async getContactGroup(
        contactGroupId: string,
    ): Promise<ContactGroupEntity | null> {
        return this.contactGroupModel.findOne({ _id: contactGroupId }).lean();
    }
}
