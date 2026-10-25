import { TestBed } from '@suites/unit';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserEntity } from './user.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserNotFoundException } from '../../errors/internal/user-not-found.exception';
import { EventBusService } from '../global/event-bus.service';
import { EventNames } from '../../events/event-names.enum';
import { Mocked } from '@suites/doubles.jest';

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hash'),
}));

jest.mock('jimp', () => ({
    Jimp: {
        fromBuffer: jest.fn().mockResolvedValue({
            crop: jest.fn(),
            resize: jest.fn(),
            getBuffer: jest.fn().mockResolvedValue(Buffer.from('jpeg')),
        }),
    },
}));

describe('User Service', () => {
    let userService: UserService;
    let mockUserModel: any;
    let mockCache: any;
    let eventBus: Mocked<EventBusService>;

    const testCredentials = { email: 'test1@email.com', password: 'testPw1' };
    const baseTestUserEntity = {
        _id: 'testUserId1',
        email: testCredentials.email,
        password: testCredentials.password,
        username: 'testUserName1',
        contacts: [],
        contactGroupIds: [],
        leftGroupIds: [],
    };

    beforeAll(async () => {
        const { unit, unitRef } = await TestBed.solitary(UserService)
            .mock(getModelToken(UserEntity.name))
            .impl((stubFn) => {
                mockUserModel = {
                    find: stubFn().mockResolvedValue([]),
                    findById: stubFn().mockResolvedValue(null),
                    findOne: stubFn().mockResolvedValue(null),
                    create: stubFn().mockResolvedValue(null),
                    updateOne: stubFn().mockResolvedValue({}),
                };
                return mockUserModel;
            })
            .mock(CACHE_MANAGER)
            .impl((stubFn) => {
                mockCache = {
                    get: stubFn().mockResolvedValue(null),
                    set: stubFn().mockResolvedValue(null),
                    del: stubFn().mockResolvedValue(null),
                };
                return mockCache;
            })
            .compile();

        userService = unit;
        eventBus = unitRef.get(EventBusService);
    });

    beforeEach(async () => {
        jest.clearAllMocks();
    });

    it('should be defined', async () => {
        expect(userService).toBeDefined();
    });

    describe('findUsersBy', () => {
        it('should return users from database', async () => {
            const users = [{ ...baseTestUserEntity, password: '' }];
            mockUserModel.find.mockResolvedValueOnce(users);
            mockCache.get.mockResolvedValueOnce(null);

            const result = await userService.findUsersBy();

            expect(result.length).toBe(1);
        });

        it('should return users from cache', async () => {
            const cachedUsers = [{ ...baseTestUserEntity, password: '' }];
            mockCache.get.mockResolvedValueOnce(cachedUsers);

            const result = await userService.findUsersBy();

            expect(result).toEqual(cachedUsers);
            expect(mockUserModel.find).not.toHaveBeenCalled();
        });
    });

    describe('findUserBy', () => {
        it('should return user by email', async () => {
            const user = { ...baseTestUserEntity };
            mockUserModel.findOne.mockResolvedValueOnce(user);

            const result = await userService.findUserBy({
                email: testCredentials.email,
            });

            expect(result).not.toBeNull();
        });

        it('should return null when user not found', async () => {
            mockUserModel.findOne.mockResolvedValueOnce(null);

            const result = await userService.findUserBy({
                email: 'non_existent@email.com',
            });

            expect(result).toBeNull();
        });
    });

    describe('findUserById', () => {
        it('should return user by id', async () => {
            const user = { ...baseTestUserEntity };
            mockUserModel.findById.mockResolvedValueOnce(user);

            const result = await userService.findUserById('testUserId1');

            expect(result).not.toBeNull();
        });

        it('should return null when user not found', async () => {
            mockUserModel.findById.mockResolvedValueOnce(null);

            const result = await userService.findUserById('non_existent_id');

            expect(result).toBeNull();
        });
    });

    describe('updateStatusText', () => {
        // updateUser converts the id to an ObjectId, so it has to be a valid one
        const userId = '507f1f77bcf86cd799439011';

        it('should store the status text and return the updated user', async () => {
            const user = { ...baseTestUserEntity, statusText: 'Available' };
            mockUserModel.findOne.mockResolvedValueOnce(baseTestUserEntity);
            mockUserModel.findById.mockResolvedValueOnce(user);

            const result = await userService.updateStatusText(
                userId,
                'Available',
            );

            expect(mockUserModel.updateOne).toHaveBeenCalledWith(
                { _id: userId },
                { _id: userId, statusText: 'Available' },
            );
            expect(result).toEqual(user);
        });

        it('should clear the status text with an empty string', async () => {
            mockUserModel.findOne.mockResolvedValueOnce(baseTestUserEntity);

            await userService.updateStatusText(userId, '');

            expect(mockUserModel.updateOne).toHaveBeenCalledWith(
                { _id: userId },
                { _id: userId, statusText: '' },
            );
        });

        it('should replace line breaks with a single space', async () => {
            mockUserModel.findOne.mockResolvedValueOnce(baseTestUserEntity);

            await userService.updateStatusText(
                userId,
                'Busy\r\n\n  in a meeting',
            );

            expect(mockUserModel.updateOne).toHaveBeenCalledWith(
                { _id: userId },
                { _id: userId, statusText: 'Busy in a meeting' },
            );
        });

        it('should clear the users cache', async () => {
            mockUserModel.findOne.mockResolvedValueOnce(baseTestUserEntity);

            await userService.updateStatusText(userId, 'Available');

            expect(mockCache.del).toHaveBeenCalled();
        });

        it('should emit a profile update with the new status text', async () => {
            mockUserModel.findOne.mockResolvedValueOnce(baseTestUserEntity);

            await userService.updateStatusText(userId, 'Busy\nin a meeting');

            expect(eventBus.emitAsync).toHaveBeenCalledWith(
                EventNames.USER_PROFILE_UPDATED,
                { userId, statusText: 'Busy in a meeting' },
            );
        });

        it('should throw when the user does not exist', async () => {
            mockUserModel.findOne.mockResolvedValueOnce(null);

            await expect(
                userService.updateStatusText(userId, 'Available'),
            ).rejects.toThrow(UserNotFoundException);
            expect(mockUserModel.updateOne).not.toHaveBeenCalled();
            expect(eventBus.emitAsync).not.toHaveBeenCalled();
        });
    });

    describe('updateUserAvatar', () => {
        const userId = '507f1f77bcf86cd799439011';

        it('should emit a profile update after the avatar was stored', async () => {
            mockUserModel.findOne.mockResolvedValueOnce(baseTestUserEntity);

            await userService.updateUserAvatar(userId, 0, 0, 10, 10, {
                buffer: Buffer.from('png'),
            } as Express.Multer.File);

            expect(eventBus.emitAsync).toHaveBeenCalledWith(
                EventNames.USER_PROFILE_UPDATED,
                { userId, avatarUpdated: true },
            );
        });
    });
});
