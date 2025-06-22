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

@Injectable()
export class UserService {
    private readonly SALT_OR_ROUNDS = 10;

    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
        private readonly logger: CustomLogger,
        @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
        private readonly jwtService: JwtService,
    ) {}

    async findUsersBy(filter?: Partial<{ [k in keyof UserEntity]: any }>) {
        const cacheKey = findUsersByCacheKey(filter);
        const usersInCache = await this.cache.get<User[]>(cacheKey);

        if (usersInCache) {
            return usersInCache;
        }

        let users = await this.userModel.find(filter ?? {});

        await this.cache.set(cacheKey, users);

        return users;
    }

    async signIn(email: string, password: string) {
        const user = await this.findUserBy({ email, password });
        if (!user) {
            this.logger.log(`User with email ${email} not found`);
            return;
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
                return;
            }

            return await this.respondWithNewTokens(user);
        } catch (error) {
            if (!refreshToken) {
                return;
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
                return;
            }

            if (
                !refreshTokenFromDb ||
                !(await bcrypt.compare(refreshToken, refreshTokenFromDb))
            ) {
                return;
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
        const hash = await bcrypt.hash(password, this.SALT_OR_ROUNDS);

        const createdUser = await this.userModel.create({
            email,
            password: hash,
            username,
        });

        if (!createdUser) {
            return;
        }

        this.logger.log(`Created user ${username}`);

        await this.cache.del(findUsersByCacheKey());

        return createdUser;
    }

    async updateUser(userPartial: Partial<User>) {
        const user = await this.findUserBy({
            _id: new Types.ObjectId(userPartial._id),
        });
        if (!user) {
            return;
        }

        await this.cache.del(findUsersByCacheKey());

        return this.userModel.updateOne({ _id: userPartial._id }, userPartial);
    }
}
