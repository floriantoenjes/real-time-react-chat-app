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

describe('MessageService', () => {
    let messageService: MessageService;

    let contactService: Mocked<ContactService>;
    let gateway: Mocked<RealTimeChatGateway>;
    let messageRepository: Mocked<Model<MessageEntity>>;
    let userRepository: Mocked<Model<UserEntity>>;

    let testSender: User;

    let testReceiver: User;

    beforeAll(async () => {
        const { unit, unitRef } = await TestBed.solitary(MessageService)
            .mock(getModelToken(UserEntity.name))
            .impl((stubFn) => ({
                findById: stubFn().mockImplementation((userId: string) => ({
                    select: async () => {
                        if (userId === testSender._id) {
                            return {
                                ...testSender,
                                markModified: () => {},
                                save: () => {},
                            };
                        }

                        if (userId === testReceiver._id) {
                            return {
                                ...testReceiver,
                                markModified: () => {},
                                save: () => {},
                            };
                        }
                    },
                })),
            }))
            .mock(getModelToken(ContactGroupEntity.name))
            .impl((stubFn) => ({
                findOne: () => ({
                    lean: stubFn().mockResolvedValue(null),
                }),
            }))
            .compile();

        messageService = unit;

        contactService = unitRef.get(ContactService);
        gateway = unitRef.get(RealTimeChatGateway);
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
    });

    it('should be defined', () => {
        expect(messageService).toBeDefined();
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

        messageRepository.create.mockResolvedValue(testMessage as any);
        contactService.addContactIfNotExists.mockImplementationOnce(
            async () => {
                const newContact = {
                    _id: testSender._id,
                    name: testSender.username,
                    avatarFileName: testSender.avatarFileName,
                    isAccepted: false,
                };
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
        expect(testReceiver.contacts).toHaveLength(1);
        expect(gateway.prepareSendMessage).toHaveBeenCalledTimes(1);
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
        expect(userRepository.findById).toHaveBeenCalledTimes(1);
        expect(testReceiver.contacts[0].lastMessage).toEqual(testMessage._id);
        expect(gateway.prepareSendMessage).toHaveBeenNthCalledWith(
            2,
            'userId2',
        );
    });
});
