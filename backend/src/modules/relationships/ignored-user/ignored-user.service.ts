import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { IgnoredUserEntity } from './ignored-user.schema';
import { UserEntity } from '../../user/user.schema';
import { UserNotFoundException } from '../../../errors/internal/user-not-found.exception';
import { CannotIgnoreSelfException } from '../../../errors/external/cannot-ignore-self.exception';
import { AlreadyIgnoredException } from '../../../errors/external/already-ignored.exception';
import { UserNotIgnoredException } from '../../../errors/external/user-not-ignored.exception';
import { EventBusService } from '../../global/event-bus.service';
import { EventNames } from '../../../events/event-names.enum';
import {
    UserIgnoredEvent,
    UserUnignoredEvent,
} from '../../../events/user.events';

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}

@Injectable()
export class IgnoredUserService implements OnModuleInit {
    private readonly logger = new Logger(IgnoredUserService.name);

    constructor(
        @InjectModel(IgnoredUserEntity.name)
        private readonly ignoredUserModel: Model<IgnoredUserEntity>,
        @InjectModel(UserEntity.name)
        private readonly userModel: Model<UserEntity>,
        private readonly eventBus: EventBusService,
    ) {}

    onModuleInit(): void {
        this.listenOnEvents();
    }

    private listenOnEvents() {
        this.eventBus.on<UserIgnoredEvent>(
            EventNames.USER_IGNORE_REQUEST,
            async (payload: UserIgnoredEvent) => {
                this.logger.debug(
                    `Handling ignore request: ${payload.userId} -> ${payload.ignoredUserId}`,
                );
                try {
                    await this.ignoreUser(
                        payload.userId,
                        payload.ignoredUserId,
                    );
                } catch (error) {
                    this.logger.error(
                        `Failed to handle ignore request: ${error}`,
                    );
                }
            },
        );
    }

    /**
     * Add a user to the ignore list
     */
    public async ignoreUser(
        userId: string,
        ignoredUserId: string,
    ): Promise<void> {
        // Validate user exists
        const user = await this.userModel.findById(userId);
        if (!user) {
            this.logger.warn(`Ignore user failed: user ${userId} not found`);
            throw new UserNotFoundException();
        }

        // Validate ignored user exists
        const ignoredUser = await this.userModel.findById(ignoredUserId).lean();
        if (!ignoredUser) {
            this.logger.warn(
                `Ignore user failed: user ${ignoredUserId} not found`,
            );
            throw new UserNotFoundException();
        }

        // Cannot ignore self
        if (userId === ignoredUserId) {
            this.logger.warn(
                `Ignore user failed: user ${userId} cannot ignore themselves`,
            );
            throw new CannotIgnoreSelfException();
        }

        // Check if already ignored
        const existingIgnore = await this.ignoredUserModel.findOne({
            userId,
            ignoredUserId,
        });

        if (existingIgnore) {
            this.logger.warn(
                `Ignore user failed: user ${userId} already ignores user ${ignoredUserId}`,
            );
            throw new AlreadyIgnoredException();
        }

        await this.ignoredUserModel.create({
            userId,
            ignoredUserId,
            createdAt: new Date(),
        });

        await this.removeContactFromUserEntity(user, ignoredUserId);

        this.eventBus.emitAsync<UserIgnoredEvent>(EventNames.USER_IGNORED, {
            userId,
            ignoredUserId,
        });

        this.logger.log(`User ${userId} ignored user ${ignoredUserId}`);
    }

    private async removeContactFromUserEntity(
        user: HydratedDocument<UserEntity>,
        ignoredUserId: string,
    ) {
        user.contacts = user.contacts.filter(
            (contact) => contact._id !== ignoredUserId,
        );
        user.markModified('contacts');
        await user.save();
    }

    /**
     * Remove a user from the ignore list
     */
    public async unignoreUser(
        userId: string,
        ignoredUserId: string,
    ): Promise<void> {
        const ignoreEntry = await this.ignoredUserModel.findOneAndDelete({
            userId,
            ignoredUserId,
        });

        if (!ignoreEntry) {
            this.logger.warn(
                `Unignore user failed: user ${userId} does not ignore user ${ignoredUserId}`,
            );
            throw new UserNotIgnoredException();
        }

        this.eventBus.emitAsync<UserUnignoredEvent>(EventNames.USER_UNIGNORED, {
            userId,
            unignoredUserId: ignoredUserId,
        });

        this.logger.log(`User ${userId} un-ignored user ${ignoredUserId}`);
    }

    /**
     * Get paginated list of ignored users for a user
     */
    public async getIgnoredUsers(
        userId: string,
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<string>> {
        const user = await this.userModel.findById(userId).lean();
        if (!user) {
            this.logger.warn(
                `Get ignored users failed: user ${userId} not found`,
            );
            throw new UserNotFoundException();
        }

        const page = pagination?.page ?? 1;
        const limit = pagination?.limit ?? 10;
        const skip = (page - 1) * limit;

        const [ignoredUsers, total] = await Promise.all([
            this.ignoredUserModel
                .find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.ignoredUserModel.countDocuments({ userId }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data: ignoredUsers.map((entry) => entry.ignoredUserId),
            total,
            page,
            totalPages,
        };
    }
}
