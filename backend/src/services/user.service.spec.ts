import { TestBed } from '@suites/unit';
import { UserService } from './user.service';
import { UserNotFoundException } from '../errors/internal/user-not-found.exception';
import { getModelToken } from '@nestjs/mongoose';
import { UserEntity } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

describe('User Service', () => {
    let userService: UserService;

    const testCredentials = { email: 'test1@email.com', password: 'testPw1' };

    const bcryptCompare = jest.fn().mockImplementation(async (pw1, pw2) => {
        return pw1 === pw2;
    });

    const bcryptHash = jest.fn().mockResolvedValue('hash');

    (bcrypt.compare as jest.Mock) = bcryptCompare;
    (bcrypt.hash as jest.Mock) = bcryptHash;

    beforeAll(async () => {
        const { unit, unitRef } = await TestBed.solitary(UserService)
            .mock(getModelToken(UserEntity.name))
            .impl((stubFn) => ({
                findOne: stubFn().mockImplementation((filter) => {
                    if (filter.email === testCredentials.email) {
                        return {
                            select: stubFn().mockResolvedValue({
                                _id: 'testUserId1',
                                email: testCredentials.email,
                                password: testCredentials.password,
                                username: 'testUserName1',
                                contacts: [],
                                contactGroupIds: [],
                                leftGroupIds: [],
                            } satisfies UserEntity),
                        };
                    } else {
                        return { select: stubFn().mockResolvedValue(null) };
                    }
                }),
            }))
            .mock(JwtService)
            .impl((stubFn) => ({
                signAsync: stubFn().mockResolvedValue('signedPayload'),
            }))
            .compile();

        userService = unit;
    });

    beforeEach(async () => {});

    it('should be defined', async () => {
        expect(userService).toBeDefined();
    });

    describe('signIn', () => {
        it('should throw exception on user not found', async () => {
            await expect(
                async () =>
                    await userService.signIn(
                        'non_existent@email.com',
                        testCredentials.password,
                    ),
            ).rejects.toThrow(UserNotFoundException);
        });

        it('should sucessfully sign in user with right credentials', async () => {
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
});
