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
    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
        private readonly logger: CustomLogger,
        @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
        private readonly jwtService: JwtService,
    ) {}

    async findUsersBy(filter?: any) {
        const cacheKey = findUsersByCacheKey(filter);
        const usersInCache = await this.cache.get<User[]>(cacheKey);

        if (usersInCache) {
            return this.returnEntityOrNotFound<User[]>(usersInCache);
        }

        let users = await this.userModel.find(filter ?? {});

        await this.cache.set(cacheKey, users);

        return this.returnEntityOrNotFound<User[]>(users);
    }

    async signIn(email: string, password: string) {
        const res = await this.findUserBy({ email, password });
        if (!res.body) {
            this.logger.log(`User with email ${email} not found`);
            return res;
        }

        const payload = { sub: res.body._id, username: res.body.username };
        this.logger.log(
            `Signed in user ${res.body.username} and id ${res.body._id}`,
        );

        return {
            status: 200 as const,
            body: {
                user: res.body,
                access_token: await this.jwtService.signAsync(payload),
            },
        };
    }

    async refresh(accessToken: string) {
        const decodedJwt = this.jwtService.decode(accessToken);

        const res = await this.findUserBy({ username: decodedJwt.username });
        if (!res.body) {
            return res;
        }

        const payload = { sub: res.body._id, username: res.body.username };
        this.logger.debug(
            `Refreshed access token for user ${res.body.username}`,
        );

        return {
            status: 200 as const,
            body: {
                user: res.body,
                access_token: await this.jwtService.signAsync(payload),
            },
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

        return this.returnEntityOrNotFound(user);
    }

    async createUser(email: string, password: string, username: string) {
        const saltOrRounds = 10;
        const hash = await bcrypt.hash(password, saltOrRounds);

        const createdUser = await this.userModel.create({
            email,
            password: hash,
            username,
        });

        if (!createdUser) {
            return { status: 400 as const, body: null };
        }

        this.logger.log(`Created user ${username}`);

        await this.cache.del(findUsersByCacheKey());

        return { status: 201 as const, body: createdUser };
    }

    async updateUser(userPartial: Partial<User>) {
        const res = await this.findUserBy({
            _id: new Types.ObjectId(userPartial._id),
        });
        if (res.status === 404) {
            return res;
        }

        await this.cache.del(findUsersByCacheKey());

        return this.userModel.updateOne({ _id: userPartial._id }, userPartial);
    }

    private returnEntityOrNotFound<T>(entity: T | null) {
        if (!entity) {
            return {
                status: 404 as const,
                body: null,
            };
        }

        return {
            status: 200 as const,
            body: entity,
        };
    }
}
