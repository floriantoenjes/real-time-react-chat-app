import { Controller, Inject } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { UserEntity } from '../schemas/user.schema';
import {
    ContactGroup,
    contactGroupContract,
} from '../../shared/contact-group.contract';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { User } from '../../shared/user.contract';
import {
    getContactGroupsCacheKey,
    getUserContactsCacheKey,
} from '../cache/cache-keys';

@Controller()
export class ContactGroupController {
    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
        @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    ) {}

    @TsRestHandler(contactGroupContract.getContactGroups)
    async getContactGroups() {
        return tsRestHandler(
            contactGroupContract.getContactGroups,
            async ({ body }) => {
                const cacheKey = getContactGroupsCacheKey(body.userId);
                const cachedUser = await this.cache.get<User>(cacheKey);
                let user: User | null;
                if (!cachedUser) {
                    user = await this.userModel
                        .findOne({
                            _id: body.userId,
                        })
                        .lean();
                } else {
                    user = cachedUser;
                }

                return {
                    status: 200,
                    body: user?.contactGroups ?? [],
                };
            },
        );
    }

    @TsRestHandler(contactGroupContract.addContactGroup)
    async addContactGroup() {
        return tsRestHandler(
            contactGroupContract.addContactGroup,
            async ({ body }) => {
                const user = await this.userModel.findOne({ _id: body.userId });
                const members = await this.userModel.find({
                    _id: { $in: body.memberIds },
                });

                if (!user || !members.length) {
                    return { status: 404, body: false };
                }

                const newContactGroup = {
                    _id: new Types.ObjectId().toString(),
                    memberIds: body.memberIds,
                    name: body.name,
                } as ContactGroup;

                const contactAlreadyExists = user.contactGroups.find(
                    (group) => group.name === newContactGroup.name,
                );
                if (contactAlreadyExists) {
                    return { status: 400, body: false };
                }

                for (const member of [user, ...members]) {
                    member.contactGroups.push({
                        ...newContactGroup,
                        memberIds: [user, ...members]
                            .map((m) => m._id)
                            .filter((mid) => mid !== member._id)
                            .map((mid) => mid.toString()),
                    });
                    member.markModified('contactGroups');

                    await member.save();
                }

                await this.cache.del(getContactGroupsCacheKey(body.userId));

                return {
                    status: 201,
                    body: newContactGroup,
                };
            },
        );
    }

    @TsRestHandler(contactGroupContract.removeContactGroup)
    async removeContactGroup() {
        return tsRestHandler(
            contactGroupContract.removeContactGroup,
            async ({ body }) => {
                const user = await this.userModel.findOne({ _id: body.userId });

                if (!user) {
                    return { status: 404, body: false };
                }

                if (
                    user.contactGroups.find(
                        (uc) => uc._id === body.contactGroupId,
                    ) === undefined
                ) {
                    return { status: 404, body: false };
                }

                user.contactGroups = user.contactGroups.filter(
                    (group) => group._id !== body.contactGroupId,
                );
                user.markModified('contactGroups');

                await user.save();

                await this.cache.del(getContactGroupsCacheKey(body.userId));

                return {
                    status: 204,
                    body: true,
                };
            },
        );
    }
}
