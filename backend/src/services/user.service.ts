import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../shared/user.contract';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserEntity } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { findUsersByCacheKey } from '../cache/cache-keys';
import { CustomLogger } from '../logging/custom-logger';
import { Jimp } from 'jimp';
import { ObjectStorageService } from './object-storage.service';
import { EmailAlreadyTakenException } from '../errors/email-already-taken.exception';
import { UserNotFoundException } from '../errors/user-not-found.exception';
import { UnauthorizedException } from '../errors/unauthorized.exception';

@Injectable()
export class UserService {
    private readonly SALT_OR_ROUNDS = 10;

    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
        private readonly logger: CustomLogger,
        @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
        private readonly jwtService: JwtService,
        private readonly objectStorageService: ObjectStorageService,
    ) {}

    async findUsersBy(filter?: Partial<{ [k in keyof UserEntity]: any }>) {
        const cacheKey = findUsersByCacheKey(filter);
        const usersInCache = await this.cache.get<User[]>(cacheKey);

        if (usersInCache) {
            return usersInCache;
        }

        const users = await this.userModel.find(filter ?? {});

        await this.cache.set(cacheKey, users);

        return users;
    }

    async signIn(email: string, password: string) {
        const user = await this.findUserBy({ email, password });
        if (!user) {
            this.logger.log(`User with email ${email} not found`);
            throw new UserNotFoundException();
        }

        const payload = { sub: user._id, username: user.username };
        this.logger.log(`Signed in user ${user.username} and id ${user._id}`);

        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: '7d',
        });

        await this.userModel.updateOne(
            { email },
            {
                $set: {
                    refreshTokenEncrypted: await bcrypt.hash(
                        refreshToken,
                        this.SALT_OR_ROUNDS,
                    ),
                },
            },
        );

        return {
            user: user,
            accessToken: await this.jwtService.signAsync(payload),
            refreshToken: refreshToken,
        };
    }

    async refresh(accessToken: string, refreshToken?: string) {
        try {
            this.jwtService.verify(accessToken);

            const decodedJwt = this.jwtService.decode(accessToken);

            const user = await this.findUserBy({
                username: decodedJwt?.username,
            });
            if (!user) {
                throw new UserNotFoundException();
            }

            return await this.respondWithNewTokens(user);
        } catch (error) {
            if (!refreshToken) {
                throw new UnauthorizedException();
            }

            try {
                this.jwtService.verify(refreshToken);
            } catch (e) {
                return;
            }

            const decodedJwt = this.jwtService.decode(refreshToken);

            const refreshTokenFromDb = (
                await this.userModel
                    .findOne({
                        username: decodedJwt.username,
                    })
                    .lean()
            )?.refreshTokenEncrypted;

            const user = await this.findUserBy({
                username: decodedJwt?.username,
            });
            if (!user) {
                throw new UserNotFoundException();
            }

            if (
                !refreshTokenFromDb ||
                !(await bcrypt.compare(refreshToken, refreshTokenFromDb))
            ) {
                throw new UnauthorizedException();
            }

            return await this.respondWithNewTokens(user);
        }
    }

    private async respondWithNewTokens(user: User) {
        const payload = { sub: user._id, username: user.username };
        this.logger.debug(`Refreshed access token for user ${user.username}`);

        const refreshTokenNew = await this.jwtService.signAsync(payload, {
            expiresIn: '7d',
        });
        await this.userModel.updateOne(
            { _id: user._id },
            {
                $set: {
                    refreshTokenEncrypted: await bcrypt.hash(
                        refreshTokenNew,
                        this.SALT_OR_ROUNDS,
                    ),
                },
            },
        );

        return {
            user,
            accessToken: await this.jwtService.signAsync(payload),
            refreshToken: refreshTokenNew,
        };
    }

    async findUserBy(filter: any) {
        const password = filter.password;
        delete filter.password;

        let user = await this.userModel.findOne(filter).select('+password');
        if (
            user &&
            password !== undefined &&
            !(await bcrypt.compare(password, user.password))
        ) {
            user = null;
        }

        if (user) {
            user.password = '';
        }

        return user;
    }

    async createUser(email: string, password: string, username: string) {
        try {
            const hash = await bcrypt.hash(password, this.SALT_OR_ROUNDS);

            const createdUser = await this.userModel.create({
                email,
                password: hash,
                username,
            });

            this.logger.log(`Created user "${username}"`);

            await this.cache.del(findUsersByCacheKey());

            return createdUser;
        } catch (e) {
            throw new EmailAlreadyTakenException();
        }
    }

    async updateUser(userPartial: Partial<User>) {
        const user = await this.findUserBy({
            _id: new Types.ObjectId(userPartial._id),
        });
        if (!user) {
            throw new UserNotFoundException();
        }

        await this.cache.del(findUsersByCacheKey());

        return this.userModel.updateOne({ _id: userPartial._id }, userPartial);
    }

    async loadAvatar(userId) {
        try {
            const objectDataString = await this.objectStorageService.loadFile(
                userId + '_avatar',
            );

            if (objectDataString) {
                return {
                    status: 200 as const,
                    body: objectDataString,
                };
            }
        } catch (e) {}

        return {
            status: 404 as const,
            body: false,
        };
    }

    async updateUserAvatar(
        userId: string,
        x: number,
        y: number,
        width: number,
        height: number,
        avatar: Express.Multer.File,
    ) {
        const fileName = userId + '_avatar';

        async function crop(
            image: Awaited<ReturnType<typeof Jimp.fromBuffer>>,
        ) {
            // Read the image.
            image.crop({
                x: x,
                y: y,
                w: width,
                h: height,
            });
            image.resize({ w: 512, h: 512 });
            // Save and overwrite the image
        }
        const img = await Jimp.fromBuffer(avatar.buffer);
        await crop(img);

        const jpeg = await img.getBuffer('image/jpeg', { quality: 60 });

        await this.objectStorageService.uploadFile(jpeg, fileName);

        await this.updateUser({
            _id: userId,
            avatarFileName: fileName,
        });

        this.logger.log(`Updated user avatar for ${userId}`);

        return {
            status: 201 as const,
            body: true,
        };
    }
}
