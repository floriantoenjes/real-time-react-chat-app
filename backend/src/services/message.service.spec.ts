import { TestBed } from '@suites/unit';
import { MessageService } from './message.service';
import { UserEntity } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { User } from '../../shared/user.contract';
import { Message } from '../../shared/message.contract';
import { Mocked } from '@suites/doubles.jest';
import { getModelToken } from '@nestjs/mongoose';
import { ContactGroupEntity } from '../schemas/contact-group.schema';
import { MessageEntity } from '../schemas/message.schema';
import { ContactService } from './contact.service';
import { RealTimeChatGateway } from '../gateways/socket.gateway';
import { Contact } from '../../shared/contact.contract';
import { UserNotFoundException } from '../errors/internal/user-not-found.exception';
import { ContactGroup } from '../../shared/contact-group.contract';
import { ContactGroupService } from './contact-group.service';

describe('MessageService', () => {
    let messageService: MessageService;

    let contactService: Mocked<ContactService>;
    let contactGroupService: Mocked<ContactGroupService>;
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

    const gatewayEmitMock = jest.fn();

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
            .mock(RealTimeChatGateway)
            .impl(() => ({
                prepareSendMessage: () => ({
                    emit: gatewayEmitMock,
                }),
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

        contactService = unitRef.get(ContactService);
        contactGroupService = unitRef.get(ContactGroupService);
        contactGroupRepository = unitRef.get(
            getModelToken(ContactGroupEntity.name),
        );
        messageRepository = unitRef.get(getModelToken(MessageEntity.name));
        userRepository = unitRef.get(getModelToken(UserEntity.name));
    });

    beforeEach(async () => {
        testSender = {
            _id: 'userId1',
            email: 'test1@email.com',
            password: 'testPassword',
            username: 'testSender',
            contacts: [],
            contactGroupIds: [],
            leftGroupIds: [],
        };

        testReceiver = {
            _id: 'userId2',
            email: 'test2@email.com',
            password: 'testPassword',
            username: 'testReceiver',
            contacts: [],
            contactGroupIds: [],
            leftGroupIds: [],
        };

        testSender.contacts.push({
            _id: testReceiver._id,
            isAccepted: true,
            name: testReceiver.username,
        });

        testReceiverGroup = {
            createdAt: new Date(),
            createdBy: testSender._id,
            isAccepted: true,
            memberIds: [testSender._id, testReceiver._id],
            name: 'testGroup1',
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
            } satisfies Message;

            const newContact = {
                _id: testSender._id,
                name: testSender.username,
                avatarFileName: testSender.avatarFileName,
                isAccepted: false,
            } satisfies Contact;

            messageRepository.create.mockResolvedValue(testMessage as any);
            contactService.addContactIfNotExists.mockImplementationOnce(
                async () => {
                    testReceiver.contacts.push(newContact);
                    return newContact;
                },
            );

            const result = await messageService.sendMessage(
                testMessage.fromUserId,
                testMessage.toUserId,
                testMessage.message,
                testMessage.type,
            );

            expect(result).toEqual({ status: 201, body: testMessage });
            expect(userRepository.findById).toHaveBeenCalled();
            expect(messageRepository.create).toHaveBeenCalled();
            expect(contactService.addContactIfNotExists).toHaveBeenCalled();
            expect(receiverMarkModifiedMock).not.toHaveBeenCalled();
            expect(receiverSaveMock).not.toHaveBeenCalled();
            expect(testSender.contacts[0].lastMessage).toEqual(testMessage._id);
            expect(testReceiver.contacts).toHaveLength(1);
            expect(gatewayEmitMock).toHaveBeenCalledTimes(1);
            expect(gatewayEmitMock).toHaveBeenCalledWith(
                'contactAutoAdded',
                newContact,
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
            } satisfies Message;

            messageRepository.create.mockResolvedValue(testMessage as any);
            const newContact = {
                _id: testSender._id,
                name: testSender.username,
                avatarFileName: testSender.avatarFileName,
                isAccepted: false,
            };
            contactService.addContactIfNotExists.mockImplementationOnce(
                async () => {
                    testReceiver.contacts.push(newContact);
                    return newContact;
                },
            );

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
            expect(gatewayEmitMock).toHaveBeenCalledTimes(2);
            expect(gatewayEmitMock).toHaveBeenCalledWith(
                'contactAutoAdded',
                newContact,
            );
            expect(gatewayEmitMock).toHaveBeenCalledWith(
                'message',
                testMessage,
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
            } satisfies Message;

            messageRepository.create.mockResolvedValue(testMessage as any);

            contactGroupService.computeGroupNamesForUser.mockResolvedValue([
                { ...testReceiverGroup, lastMessage: testMessage._id },
            ]);

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

            expect(gatewayEmitMock).toHaveBeenCalledTimes(2);
            expect(gatewayEmitMock).toHaveBeenCalledWith(
                'contactGroupAutoAdded',
                {
                    ...testReceiverGroup,
                    lastMessage: testMessage._id,
                },
            );
            expect(gatewayEmitMock).toHaveBeenCalledWith(
                'message',
                testMessage,
            );
        });
    });
});
