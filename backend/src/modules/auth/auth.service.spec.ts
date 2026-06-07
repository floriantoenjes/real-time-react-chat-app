import { TestBed } from '@suites/unit';
import { AuthService } from './auth.service';
import { UserNotFoundException } from '../../errors/internal/user-not-found.exception';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Mocked } from '@suites/doubles.jest';
import { UnauthorizedException } from '../../errors/external/unauthorized.exception';
import { AuthUser } from '../../../shared/auth.contract';
import { AuthUserEntity } from './auth.schema';
import { EmailAlreadyTakenException } from '../../errors/external/email-already-taken.exception';

describe('Auth Service', () => {
    let authService: AuthService;
    let jwtService: Mocked<JwtService>;
    let mockAuthUserModel: any;

    const testCredentials = { email: 'test1@email.com', password: 'testPw1' };
    const baseTestUserEntity = {
        _id: 'testUserId1',
        email: testCredentials.email,
        password: testCredentials.password,
    } satisfies AuthUser;

    const bcryptCompare = jest.fn().mockImplementation(async (pw1, pw2) => {
        return pw1 === pw2;
    });
    const bcryptHash = jest.fn().mockResolvedValue('hash');

    (bcrypt.compare as jest.Mock) = bcryptCompare;
    (bcrypt.hash as jest.Mock) = bcryptHash;

    beforeAll(async () => {
        const { unit, unitRef } = await TestBed.solitary(AuthService)
            .mock(getModelToken(AuthUserEntity.name))
            .impl((stubFn) => {
                mockAuthUserModel = {
                    create: stubFn().mockResolvedValue(null),
                    findOne: stubFn().mockImplementation((filter) => {
                        // Return a query-like object that has a select method
                        const user =
                            filter.email === testCredentials.email
                                ? { ...baseTestUserEntity }
                                : filter.username === 'testUserName1'
                                  ? { ...baseTestUserEntity }
                                  : null;

                        if (user) {
                            return {
                                select: () =>
                                    Promise.resolve({
                                        ...user,
                                        password: user.password,
                                    }),
                            };
                        }
                        return {
                            select: () => Promise.resolve(null),
                        };
                    }),
                    updateOne: stubFn().mockResolvedValue({}),
                };
                return mockAuthUserModel;
            })
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
                verify: stubFn().mockResolvedValue({}),
            }))
            .compile();

        authService = unit;
        jwtService = unitRef.get(JwtService);
    });

    beforeEach(async () => {
        jest.clearAllMocks();
    });

    it('should be defined', async () => {
        expect(authService).toBeDefined();
    });

    describe('signIn', () => {
        it('should throw exception when user not found', async () => {
            mockAuthUserModel.findOne.mockReturnValueOnce({
                select: () => Promise.resolve(null),
            });

            await expect(
                async () =>
                    await authService.signIn(
                        'non_existent@email.com',
                        testCredentials.password,
                    ),
            ).rejects.toThrow(UserNotFoundException);
        });

        it('should successfully sign in user with right credentials', async () => {
            const user = { ...baseTestUserEntity };
            mockAuthUserModel.findOne.mockReturnValueOnce({
                select: () =>
                    Promise.resolve({ ...user, password: user.password }),
            });

            const result = await authService.signIn(
                testCredentials.email,
                testCredentials.password,
            );

            expect(result.accessToken).toBe('signedPayload');
            expect(result.refreshToken).toBe('signedPayload');
            expect(result.authUser.password).toBe('');
        });
    });

    describe('refresh', () => {
        it('respond with new token on valid access token', async () => {
            const user = { ...baseTestUserEntity };
            // For findUserByUsername, findOne is called without select
            mockAuthUserModel.findOne.mockReturnValueOnce(
                Promise.resolve(user),
            );

            const result = await authService.refresh(
                'testToken',
                'testRefreshToken',
            );

            expect(result.accessToken).toBe('signedPayload');
            expect(result.refreshToken).toBe('signedPayload');
            expect(result.authUser.password).toBe('');
        });

        it('throw unauthorized on invalid access token', async () => {
            jwtService.verify.mockImplementationOnce(() => {
                throw new Error('Invalid token');
            });

            await expect(
                async () =>
                    await authService.refresh(
                        'invalidTestToken',
                        'testRefreshToken',
                    ),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('respond with new token on invalid access token and valid refresh token', async () => {
            const user = {
                ...baseTestUserEntity,
                refreshTokenEncrypted: 'hashedRefreshToken',
            };
            jwtService.verify
                .mockImplementationOnce((token) => {
                    throw new Error('Invalid token ' + token);
                })
                .mockImplementationOnce(() => {
                    return {};
                });

            mockAuthUserModel.findOne.mockReturnValueOnce(
                Promise.resolve(user),
            );
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

            const result = await authService.refresh(
                'testToken',
                'testRefreshToken',
            );

            expect(result.authUser.password).toBe('');
            expect(result.accessToken).toBe('signedPayload');
            expect(result.refreshToken).toBe('signedPayload');
        });

        it('throw unauthorized on invalid refresh token', async () => {
            const user = {
                ...baseTestUserEntity,
                refreshTokenEncrypted: 'testRefreshToken',
            };
            jwtService.verify
                .mockImplementationOnce((token) => {
                    throw new Error('Invalid token ' + token);
                })
                .mockImplementationOnce((refreshToken) => {
                    throw new Error('Invalid refresh token ' + refreshToken);
                });

            mockAuthUserModel.findOne.mockReturnValueOnce(
                Promise.resolve(user),
            );

            await expect(
                async () =>
                    await authService.refresh('testToken', 'testRefreshToken'),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('createAuthUser', () => {
        it('should throw email already taken', async () => {
            mockAuthUserModel.create.mockRejectedValueOnce(
                new Error('email already taken'),
            );

            await expect(async () => {
                await authService.createAuthUser(
                    testCredentials.email,
                    testCredentials.password,
                    'testUserName1',
                );
            }).rejects.toThrow(EmailAlreadyTakenException);
        });

        it('should create user successfully', async () => {
            const newUser = { ...baseTestUserEntity, password: 'hash' };
            mockAuthUserModel.create.mockResolvedValueOnce(newUser);

            const result = await authService.createAuthUser(
                testCredentials.email,
                testCredentials.password,
                'testUserName1',
            );

            expect(result?.password).toBe('');
            expect(result?.email).toBe(testCredentials.email);
        });
    });
});
