import { TestBed } from '@suites/unit';
import { UserService } from './user.service';
import { UserNotFoundException } from '../errors/internal/user-not-found.exception';
import { getModelToken } from '@nestjs/mongoose';
import { UserEntity } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Mocked } from '@suites/doubles.jest';
import { UnauthorizedException } from '../errors/external/unauthorized.exception';
import { EmailAlreadyTakenException } from '../errors/external/email-already-taken.exception';

describe('User Service', () => {
    let userService: UserService;
    let jwtService: Mocked<JwtService>;

    const testCredentials = { email: 'test1@email.com', password: 'testPw1' };
    let testUserEntity: UserEntity;

    const bcryptCompare = jest.fn().mockImplementation(async (pw1, pw2) => {
        return pw1 === pw2;
    });
    const bcryptHash = jest.fn().mockResolvedValue('hash');

    (bcrypt.compare as jest.Mock) = bcryptCompare;
    (bcrypt.hash as jest.Mock) = bcryptHash;

    beforeAll(async () => {
        type Email = string;
        const mockUserDb = new Set<Email>();

        const { unit, unitRef } = await TestBed.solitary(UserService)
            .mock(getModelToken(UserEntity.name))
            .impl((stubFn) => ({
                findOne: stubFn().mockImplementation((filter) => {
                    if (
                        filter.email === testCredentials.email ||
                        filter.username === 'testUserName1'
                    ) {
                        return {
                            select: stubFn().mockResolvedValue(testUserEntity),
                            lean: stubFn().mockResolvedValue(testUserEntity),
                        };
                    } else {
                        return {
                            select: stubFn().mockResolvedValue(null),
                            lean: stubFn().mockResolvedValue(null),
                        };
                    }
                }),
                create: stubFn().mockImplementation((filter) => {
                    if (mockUserDb.has(filter.email)) {
                        throw new Error('email already taken');
                    }

                    if (filter.email === testCredentials.email) {
                        mockUserDb.add(filter.email);
                    }
                }),
            }))
            .mock(JwtService)
            .impl((stubFn) => ({
                signAsync: stubFn().mockResolvedValue('signedPayload'),
                decode: stubFn().mockImplementation((accessToken: string) => {
                    if (
                        accessToken === 'testToken' ||
                        accessToken === 'testRefreshToken'
                    ) {
                        return { username: 'testUserName1' };
                    } else {
                        return null;
                    }
                }),
            }))
            .compile();

        userService = unit;
        jwtService = unitRef.get(JwtService);
    });

    beforeEach(async () => {
        testUserEntity = {
            _id: 'testUserId1',
            email: testCredentials.email,
            password: testCredentials.password,
            username: 'testUserName1',
            contacts: [],
            contactGroupIds: [],
            leftGroupIds: [],
        };

        jest.clearAllMocks();
    });

    it('should be defined', async () => {
        expect(userService).toBeDefined();
    });

    describe('signIn', () => {
        it('should throw exception when user not found', async () => {
            await expect(
                async () =>
                    await userService.signIn(
                        'non_existent@email.com',
                        testCredentials.password,
                    ),
            ).rejects.toThrow(UserNotFoundException);
        });

        it('should successfully sign in user with right credentials', async () => {
            const result = await userService.signIn(
                testCredentials.email,
                testCredentials.password,
            );

            expect(result).toEqual({
                accessToken: 'signedPayload',
                refreshToken: 'signedPayload',
                user: {
                    _id: 'testUserId1',
                    contactGroupIds: [],
                    contacts: [],
                    email: 'test1@email.com',
                    leftGroupIds: [],
                    password: '',
                    username: 'testUserName1',
                },
            });
        });
    });

    describe('refresh', () => {
        it('respond with new token on valid access token', async () => {
            const result = await userService.refresh(
                'testToken',
                'testRefreshToken',
            );

            expect(result).toEqual({
                accessToken: 'signedPayload',
                refreshToken: 'signedPayload',
                user: testUserEntity,
            });
        });

        it('throw unauthorized on invalid access token', async () => {
            await expect(
                async () =>
                    await userService.refresh(
                        'invalidTestToken',
                        'testRefreshToken',
                    ),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('respond with new token on invalid access token and valid refresh token', async () => {
            jwtService.verify.mockImplementationOnce((token) => {
                throw new Error('Invalid token ' + token);
            });
            testUserEntity.refreshTokenEncrypted = 'testRefreshToken';

            const result = await userService.refresh(
                'testToken',
                'testRefreshToken',
            );

            expect(result).toEqual({
                accessToken: 'signedPayload',
                refreshToken: 'signedPayload',
                user: testUserEntity,
            });
        });

        it('respond with new token on invalid access token and valid refresh token', async () => {
            jwtService.verify
                .mockImplementationOnce((token) => {
                    throw new Error('Invalid token ' + token);
                })
                .mockImplementationOnce((refreshToken) => {
                    throw new Error('Invalid refresh token ' + refreshToken);
                });
            testUserEntity.refreshTokenEncrypted = 'testRefreshToken';

            await expect(
                async () =>
                    await userService.refresh('testToken', 'testRefreshToken'),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('createUser', () => {
        it('should throw email already taken', async () => {
            await expect(async () => {
                await userService.createUser(
                    testUserEntity.email,
                    testUserEntity.password,
                    testUserEntity.username,
                );

                await userService.createUser(
                    testUserEntity.email,
                    'anotherPassword',
                    'anotherUsername',
                );
            }).rejects.toThrow(EmailAlreadyTakenException);
        });
    });
});
