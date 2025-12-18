import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from '../schemas/user.schema';
import { Model, Types } from 'mongoose';
import { CustomLogger } from '../logging/custom-logger';
import { ContactGroup } from '../../shared/contact-group.contract';

@Injectable()
export class ContactGroupService {
    constructor(
        private readonly logger: CustomLogger,
        @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    ) {}

    async getContactGroups(userId: string) {
        const user = await this.userModel
            .findOne({
                _id: userId,
            })
            .lean();

        return {
            status: 200 as const,
            body: user?.contactGroups ?? [],
        };
    }

    async addContactGroup(userId: string, name: string, memberIds: string[]) {
        const user = await this.userModel.findOne({ _id: userId });
        const members = await this.userModel.find({
            _id: { $in: memberIds },
        });

        if (!user || !members.length) {
            return { status: 404 as const, body: false };
        }

        const newContactGroup = {
            _id: new Types.ObjectId().toString(),
            memberIds: memberIds,
            name: name,
        } as ContactGroup;

        const contactAlreadyExists = user.contactGroups.find(
            (group) => group.name === newContactGroup.name,
        );
        if (contactAlreadyExists) {
            this.logger.warn(
                `User ${userId} tried to add already existing contact-group ${memberIds}`,
            );
            return { status: 400 as const, body: false };
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

        return {
            status: 201 as const,
            body: newContactGroup,
        };
    }

    async removeContactGroup(userId: string, contactGroupId: string) {
        const user = await this.userModel.findOne({ _id: userId });

        if (!user) {
            return { status: 404 as const, body: false };
        }

        if (
            user.contactGroups.find((uc) => uc._id === contactGroupId) ===
            undefined
        ) {
            return { status: 404 as const, body: false };
        }

        user.contactGroups = user.contactGroups.filter(
            (group) => group._id !== contactGroupId,
        );
        user.markModified('contactGroups');

        await user.save();

        return {
            status: 204 as const,
            body: true,
        };
    }
}
