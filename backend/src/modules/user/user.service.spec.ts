import { TestBed } from '@suites/unit';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserEntity } from './user.schema';
import * as bcrypt from 'bcrypt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('User Service', () => {
    let userService: UserService;
    let mockUserModel: any;
    let mockCache: any;

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

    const bcryptHash = jest.fn().mockResolvedValue('hash');

    (bcrypt.hash as jest.Mock) = bcryptHash;

    beforeAll(async () => {
        const { unit } = await TestBed.solitary(UserService)
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
});
