import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { User } from '../../../shared/user.contract';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserEntity } from './user.schema';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { findUsersByCacheKey } from '../../cache/cache-keys';
import { Jimp } from 'jimp';
import { ObjectStorageService } from '../global/object-storage.service';
import { UserNotFoundException } from '../../errors/internal/user-not-found.exception';
import { ObjectNotFoundException } from '../../errors/internal/object-not-found.exception';
import { EventBusService } from '../global/event-bus.service';
import { UserCreatedEvent } from '../../events/user.events';
import { EventNames } from '../../events/event-names.enum';

@Injectable()
export class UserService implements OnModuleInit {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
        private readonly eventBus: EventBusService,
        @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
        private readonly objectStorageService: ObjectStorageService,
    ) {}
    onModuleInit() {
        this.eventBus.on<UserCreatedEvent>(
            EventNames.USER_CREATED,
            async (event) => {
                void this.userModel.create({
                    authUserId: event.authUserId,
                    username: event.username,
                });
            },
        );
    }

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

    async findUserBy(filter: any) {
        return await this.userModel.findOne(filter);
    }

    async findUserById(id: string) {
        return await this.userModel.findById(id);
    }

    async updateUser(userPartial: Partial<User>) {
        const user = await this.findUserBy({
            _id: new Types.ObjectId(userPartial._id),
        });
        if (!user) {
            this.logger.warn(
                `Update user failed: user ${userPartial._id} not found`,
            );
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
        } catch (error: any) {
            this.logger.warn(
                `Avatar load failed for user ${userId}: ${error.message}`,
            );
            throw new ObjectNotFoundException(error);
        }

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

    async getSignedInUser(signedInUserId: string) {
        return this.userModel.findById(signedInUserId);
    }
}
