import { TestBed } from '@suites/unit';
import { MessageService } from './message.service';
import { UserEntity } from '../user/user.schema';
import { Model } from 'mongoose';
import { User } from '../../../shared/user.contract';
import { Message } from '../../../shared/message.contract';
import { Mocked } from '@suites/doubles.jest';
import { getModelToken } from '@nestjs/mongoose';
import { ContactGroupEntity } from '../relationships/contact-group/contact-group.schema';
import { MessageEntity } from './message.schema';
import { Contact } from '../../../shared/contact.contract';
import { UserNotFoundException } from '../../errors/internal/user-not-found.exception';
import { ContactGroup } from '../../../shared/contact-group.contract';
import { EventBusService } from '../global/event-bus.service';
import { EventNames } from '../../events/event-names.enum';
import { MessageSentEvent } from '../../events/message.events';
import {
    ContactAutoAddEvent,
    ContactGroupAutoAddEvent,
} from '../../events/contact.events';

describe('MessageService', () => {
    let messageService: MessageService;

    let eventBus: Mocked<EventBusService>;
    let contactGroupRepository: Mocked<Model<ContactGroupEntity>>;
    let messageRepository: Mocked<Model<MessageEntity>>;
    let userRepository: Mocked<Model<UserEntity>>;

    let testSender: User;
    const senderMarkModifiedMock = jest.fn();
    const senderSaveMock = jest.fn();

    let testReceiver: User;
    const receiverMarkModifiedMock = jest.fn();
    const receiverSaveMock = jest.fn();

    let testReceiverGroup: ContactGroup;

    beforeAll(async () => {
        const { unit, unitRef } = await TestBed.solitary(MessageService)
            .mock(getModelToken(UserEntity.name))
            .impl((stubFn) => ({
                findById: stubFn().mockImplementation((userId: string) => ({
                    select: async () => {
                        if (userId === testSender._id) {
                            return {
                                ...testSender,
                                markModified: senderMarkModifiedMock,
                                save: senderSaveMock,
                            };
                        }

                        if (userId === testReceiver._id) {
                            return {
                                ...testReceiver,
                                markModified: receiverMarkModifiedMock,
                                save: receiverSaveMock,
                            };
                        }
                    },
                })),
            }))
            .mock(getModelToken(ContactGroupEntity.name))
            .impl((stubFn) => ({
                findOne: stubFn().mockImplementation((query: any) => {
                    if (query._id === testReceiverGroup._id) {
                        return {
                            lean: stubFn().mockResolvedValue(testReceiverGroup),
                        };
                    }
                    return {
                        lean: stubFn().mockResolvedValue(null),
                    };
                }),
                updateOne: stubFn().mockResolvedValue({}),
            }))
            .compile();

        messageService = unit;

        eventBus = unitRef.get(EventBusService);
        contactGroupRepository = unitRef.get(
            getModelToken(ContactGroupEntity.name),
        );
        messageRepository = unitRef.get(getModelToken(MessageEntity.name));
        userRepository = unitRef.get(getModelToken(UserEntity.name));
    });

    beforeEach(async () => {
        testSender = {
            _id: 'userId1',
            username: 'testSender',
            contacts: [],
            contactGroupIds: [],
            leftGroupIds: [],
        } satisfies User;

        testReceiver = {
            _id: 'userId2',
            username: 'testReceiver',
            contacts: [],
            contactGroupIds: [],
            leftGroupIds: [],
        } satisfies User;

        testSender.contacts.push({
            _id: testReceiver._id,
            isAccepted: true,
            name: testReceiver.username,
        });

        testReceiverGroup = {
            createdAt: new Date(),
            createdBy: {
                creatorId: testSender._id,
                creatorName: 'creator name',
            },
            isAccepted: true,
            memberRefs: [
                { memberId: testSender._id, memberName: testSender.username },
                {
                    memberId: testReceiver._id,
                    memberName: testReceiver.username,
                },
            ],
            name: 'testSender',
            _id: 'groupId1',
        };

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(messageService).toBeDefined();
    });

    describe('sendMessage', () => {
        it('should throw if sender does not exist', async () => {
            const testMessage = {
                _id: 'messageId1',
                message: 'Test message.',
                type: 'text',
                fromUserId: 'NON EXISTENT ID',
                toUserId: testReceiver._id,
                at: new Date(),
                read: false,
                sent: false,
                owners: ['NON EXISTENT ID', testReceiver._id],
            } satisfies Message;

            await expect(
                async () =>
                    await messageService.sendMessage(
                        testMessage.fromUserId,
                        testMessage.toUserId,
                        testMessage.message,
                        testMessage.type,
                    ),
            ).rejects.toThrow(UserNotFoundException);
        });

        it('should send a message and create contact request', async () => {
            const testMessage = {
                _id: 'messageId1',
                message: 'Test message.',
                type: 'text',
                fromUserId: testSender._id,
                toUserId: testReceiver._id,
                at: new Date(),
                read: false,
                sent: false,
                owners: [testSender._id, testReceiver._id],
            } satisfies Message;

            const newContact = {
                _id: testSender._id,
                name: testSender.username,
                avatarFileName: testSender.avatarFileName,
                isAccepted: false,
            } satisfies Contact;

            messageRepository.create.mockResolvedValue(testMessage as any);
            eventBus.emitAsync.mockImplementationOnce(async () => {
                testReceiver.contacts.push(newContact);
                return newContact;
            });

            const result = await messageService.sendMessage(
                testMessage.fromUserId,
                testMessage.toUserId,
                testMessage.message,
                testMessage.type,
            );

            expect(result).toEqual({ status: 201, body: testMessage });
            expect(userRepository.findById).toHaveBeenCalled();
            expect(messageRepository.create).toHaveBeenCalled();
            expect(eventBus.emitAsync).toHaveBeenCalled();
            expect(receiverMarkModifiedMock).toHaveBeenCalled();
            expect(receiverSaveMock).toHaveBeenCalled();
            expect(testSender.contacts[0].lastMessage).toEqual(testMessage._id);
            expect(testReceiver.contacts).toHaveLength(1);
            expect(eventBus.emitAsync).toHaveBeenCalledTimes(2);
            expect(eventBus.emitAsync).toHaveBeenCalledWith(
                EventNames.CONTACT_AUTO_ADD,
                {
                    userId: testMessage.toUserId,
                    contactUserId: testMessage.fromUserId,
                } satisfies ContactAutoAddEvent,
            );
        });

        it('should send a message and set last message on contact', async () => {
            testReceiver.contacts.push({
                _id: testSender._id,
                name: testSender.username,
                avatarFileName: testSender.avatarFileName,
                isAccepted: true,
            });
            const testMessage = {
                _id: 'messageId1',
                message: 'Test message.',
                type: 'text',
                fromUserId: testSender._id,
                toUserId: testReceiver._id,
                at: new Date(),
                read: false,
                sent: false,
                owners: [testSender._id, testReceiver._id],
            } satisfies Message;

            messageRepository.create.mockResolvedValue(testMessage as any);
            const newContact = {
                _id: testSender._id,
                name: testSender.username,
                avatarFileName: testSender.avatarFileName,
                isAccepted: false,
            };
            eventBus.emitAsync.mockImplementationOnce(async () => {
                testReceiver.contacts.push(newContact);
                return newContact;
            });

            const result = await messageService.sendMessage(
                testMessage.fromUserId,
                testMessage.toUserId,
                testMessage.message,
                testMessage.type,
            );

            expect(result).toEqual({ status: 201, body: testMessage });
            expect(userRepository.findById).toHaveBeenCalled();
            expect(messageRepository.create).toHaveBeenCalled();
            expect(receiverMarkModifiedMock).toHaveBeenCalledTimes(1);
            expect(receiverSaveMock).toHaveBeenCalledTimes(1);
            expect(testSender.contacts[0].lastMessage).toEqual(testMessage._id);
            expect(testReceiver.contacts[0].lastMessage).toEqual(
                testMessage._id,
            );
            expect(eventBus.emitAsync).toHaveBeenCalledTimes(2);
            expect(eventBus.emitAsync).toHaveBeenNthCalledWith(
                1,
                EventNames.CONTACT_AUTO_ADD,
                {
                    userId: testMessage.toUserId,
                    contactUserId: testMessage.fromUserId,
                } satisfies ContactAutoAddEvent,
            );
            expect(eventBus.emitAsync).toHaveBeenNthCalledWith(
                2,
                EventNames.MESSAGE_SENT,
                {
                    message: testMessage,
                    recipientId: testMessage.toUserId,
                } satisfies MessageSentEvent,
            );
        });

        it('should send a message to a contact group and set last message on it', async () => {
            const testMessage = {
                _id: 'testMessageId1',
                message: 'test message',
                read: false,
                sent: false,
                type: 'text',
                fromUserId: testSender._id,
                toUserId: testReceiverGroup._id,
                at: new Date(),
                owners: [testSender._id, testReceiverGroup._id],
            } satisfies Message;

            messageRepository.create.mockResolvedValue(testMessage as any);

            const result = await messageService.sendMessage(
                testMessage.fromUserId,
                testMessage.toUserId,
                testMessage.message,
                testMessage.type,
            );

            expect(result).toEqual({ status: 201, body: testMessage });
            expect(userRepository.findById).toHaveBeenCalled();
            expect(contactGroupRepository.findOne).toHaveBeenCalled();
            expect(messageRepository.create).toHaveBeenCalled();

            expect(receiverMarkModifiedMock).toHaveBeenCalledTimes(0);
            expect(receiverSaveMock).toHaveBeenCalledTimes(0);
            expect(testReceiverGroup.lastMessage).toEqual(testMessage._id);

            expect(eventBus.emitAsync).toHaveBeenCalledTimes(2);
            expect(eventBus.emitAsync).toHaveBeenNthCalledWith(
                1,
                EventNames.CONTACT_GROUP_AUTO_ADD,
                {
                    userId: testReceiver._id,
                    group: testReceiverGroup,
                } satisfies ContactGroupAutoAddEvent,
            );
            expect(eventBus.emitAsync).toHaveBeenNthCalledWith(
                2,
                EventNames.MESSAGE_SENT,
                {
                    message: testMessage satisfies Message,
                    recipientId: testReceiver._id,
                } satisfies MessageSentEvent,
            );
        });
    });
});
