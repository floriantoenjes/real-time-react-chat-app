import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from '../schemas/user.schema';
import { Model, Types } from 'mongoose';
import { ContactGroup } from '../../shared/contact-group.contract';
import { ContactGroupEntity } from '../schemas/contact-group.schema';
import { UserNotFoundException } from '../errors/internal/user-not-found.exception';
import { MembersNotFoundException } from '../errors/internal/members-not-found.exception';
import { ContactGroupNotFoundException } from '../errors/internal/contact-group-not-found.exception';
import { NotAGroupMemberException } from '../errors/internal/not-a-group-member.exception';

@Injectable()
export class ContactGroupService {
    private readonly logger = new Logger(ContactGroupService.name);

    constructor(
        @InjectModel(ContactGroupEntity.name)
        private contactGroupModel: Model<ContactGroupEntity>,
        @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    ) {}

    /**
     * Normalize member IDs: sort and deduplicate
     */
    private normalizeMemberIds(memberIds: string[]): string[] {
        return [...new Set(memberIds)].sort();
    }

    /**
     * Find an existing group with the exact same member set
     */
    private async findGroupByMemberSet(
        normalizedMemberIds: string[],
    ): Promise<ContactGroupEntity | null> {
        return this.contactGroupModel.findOne({
            memberIds: normalizedMemberIds,
        });
    }

    /**
     * Compute personalized group name for a user (excludes their own name)
     */
    private async computeGroupNamesForUser(
        groups: ContactGroupEntity[],
        userId: string,
    ): Promise<ContactGroup[]> {
        // Collect all unique member IDs across all groups
        const allMemberIds = new Set<string>();
        for (const group of groups) {
            for (const memberId of group.memberIds) {
                if (memberId !== userId) {
                    allMemberIds.add(memberId);
                }
            }
        }

        // Fetch all member usernames in one query
        const members = await this.userModel
            .find({ _id: { $in: [...allMemberIds] } })
            .select('_id username')
            .lean();

        const memberNameMap = new Map<string, string>();
        for (const member of members) {
            memberNameMap.set(member._id.toString(), member.username);
        }

        // Build personalized names for each group
        return groups.map((group) => {
            const otherMemberNames = group.memberIds
                .filter((id) => id !== userId)
                .map((id) => memberNameMap.get(id) ?? 'Unknown')
                .sort();

            return {
                ...group,
                _id: group._id.toString(),
                name: otherMemberNames.join(', '),
            } as ContactGroup;
        });
    }

    async getContactGroups(userId: string) {
        const user = await this.userModel.findOne({ _id: userId }).lean();

        if (!user) {
            this.logger.warn(
                `Get contact groups failed: user ${userId} not found`,
            );
            throw new UserNotFoundException();
        }

        const contactGroupIds = user.contactGroupIds ?? [];
        const groups = await this.contactGroupModel
            .find({ _id: { $in: contactGroupIds } })
            .lean();

        const groupsWithPersonalizedNames = await this.computeGroupNamesForUser(
            groups,
            userId,
        );

        return {
            status: 200 as const,
            body: groupsWithPersonalizedNames,
        };
    }

    async addContactGroup(userId: string, name: string, memberIds: string[]) {
        const user = await this.userModel.findOne({ _id: userId });
        if (!user) {
            this.logger.warn(
                `Add contact group failed: user ${userId} not found`,
            );
            throw new UserNotFoundException();
        }

        const members = await this.userModel.find({
            _id: { $in: memberIds },
        });

        if (!members.length) {
            this.logger.warn(
                `Add contact group failed: no members found for IDs ${memberIds.join(', ')}`,
            );
            throw new MembersNotFoundException();
        }

        // Normalize memberIds (include creator, sort, dedupe)
        const allMemberIds = [userId, ...memberIds];
        const normalizedMemberIds = this.normalizeMemberIds(allMemberIds);

        // Check if a group with the same member set already exists
        const existingGroup =
            await this.findGroupByMemberSet(normalizedMemberIds);

        if (existingGroup) {
            // Add user to existing group if not already a member (via contactGroupIds)
            const groupId = existingGroup._id.toString();

            // Add group to all members who don't have it
            const bulkOps = normalizedMemberIds.map((memberId) => ({
                updateOne: {
                    filter: {
                        _id: memberId,
                        contactGroupIds: { $ne: groupId },
                    },
                    update: {
                        $push: { contactGroupIds: groupId },
                        $pull: { leftGroupIds: groupId },
                    },
                },
            }));

            await this.userModel.bulkWrite(bulkOps);

            this.logger.log(
                `User ${userId} joined existing group ${groupId} with members ${normalizedMemberIds.join(', ')}`,
            );

            const [groupWithPersonalizedName] =
                await this.computeGroupNamesForUser([existingGroup], userId);

            return {
                status: 200 as const,
                body: groupWithPersonalizedName,
            };
        }

        // Create new group
        const newContactGroup = await this.contactGroupModel.create({
            _id: new Types.ObjectId(),
            memberIds: normalizedMemberIds,
            name: name,
            createdBy: userId,
            createdAt: new Date(),
        });

        const groupId = newContactGroup._id.toString();

        // Add group to all members' contactGroupIds
        const bulkOps = normalizedMemberIds.map((memberId) => ({
            updateOne: {
                filter: { _id: memberId },
                update: {
                    $push: { contactGroupIds: groupId },
                },
            },
        }));

        await this.userModel.bulkWrite(bulkOps);

        this.logger.log(
            `User ${userId} created new group ${groupId} with members ${normalizedMemberIds.join(', ')}`,
        );

        const [newGroupWithPersonalizedName] =
            await this.computeGroupNamesForUser(
                [newContactGroup.toObject()],
                userId,
            );

        return {
            status: 201 as const,
            body: newGroupWithPersonalizedName,
        };
    }

    async leaveContactGroup(userId: string, contactGroupId: string) {
        const user = await this.userModel.findOne({ _id: userId });

        if (!user) {
            this.logger.warn(
                `Leave contact group failed: user ${userId} not found`,
            );
            throw new UserNotFoundException();
        }

        const group = await this.contactGroupModel.findOne({
            _id: contactGroupId,
        });

        if (!group) {
            this.logger.warn(
                `Leave contact group failed: group ${contactGroupId} not found`,
            );
            throw new ContactGroupNotFoundException();
        }

        // Verify user is a member of this group
        if (!group.memberIds.includes(userId)) {
            this.logger.warn(
                `Leave contact group failed: user ${userId} is not a member of group ${contactGroupId}`,
            );
            throw new NotAGroupMemberException();
        }

        // Move from contactGroupIds to leftGroupIds
        await this.userModel.updateOne(
            { _id: userId },
            {
                $pull: { contactGroupIds: contactGroupId },
                $addToSet: { leftGroupIds: contactGroupId },
            },
        );

        this.logger.log(`User ${userId} left group ${contactGroupId}`);

        return {
            status: 200 as const,
            body: true,
        };
    }

    async rejoinContactGroup(userId: string, contactGroupId: string) {
        const user = await this.userModel.findOne({ _id: userId });

        if (!user) {
            this.logger.warn(
                `Rejoin contact group failed: user ${userId} not found`,
            );
            throw new UserNotFoundException();
        }

        const group = await this.contactGroupModel.findOne({
            _id: contactGroupId,
        });

        if (!group) {
            this.logger.warn(
                `Rejoin contact group failed: group ${contactGroupId} not found`,
            );
            throw new ContactGroupNotFoundException();
        }

        // Verify user is a member of this group
        if (!group.memberIds.includes(userId)) {
            this.logger.warn(
                `Rejoin contact group failed: user ${userId} is not a member of group ${contactGroupId}`,
            );
            throw new NotAGroupMemberException();
        }

        // Move from leftGroupIds back to contactGroupIds
        await this.userModel.updateOne(
            { _id: userId },
            {
                $pull: { leftGroupIds: contactGroupId },
                $addToSet: { contactGroupIds: contactGroupId },
            },
        );

        this.logger.log(`User ${userId} rejoined group ${contactGroupId}`);

        const [groupWithPersonalizedName] = await this.computeGroupNamesForUser(
            [group],
            userId,
        );

        return {
            status: 200 as const,
            body: groupWithPersonalizedName,
        };
    }

    async getLeftGroups(userId: string) {
        const user = await this.userModel.findOne({ _id: userId }).lean();

        if (!user) {
            this.logger.warn(
                `Get left groups failed: user ${userId} not found`,
            );
            throw new UserNotFoundException();
        }

        const leftGroupIds = user.leftGroupIds ?? [];
        const groups = await this.contactGroupModel
            .find({ _id: { $in: leftGroupIds } })
            .lean();

        const groupsWithPersonalizedNames = await this.computeGroupNamesForUser(
            groups,
            userId,
        );

        return {
            status: 200 as const,
            body: groupsWithPersonalizedNames,
        };
    }

    async getContactGroupById(
        groupId: string,
    ): Promise<ContactGroupEntity | null> {
        return this.contactGroupModel.findOne({ _id: groupId }).lean();
    }

    async removeContactGroup(userId: string, contactGroupId: string) {
        const user = await this.userModel.findOne({ _id: userId });

        if (!user) {
            this.logger.warn(
                `Remove contact group failed: user ${userId} not found`,
            );
            throw new UserNotFoundException();
        }

        const userContactGroupIds = user.contactGroupIds ?? [];
        if (!userContactGroupIds.includes(contactGroupId)) {
            this.logger.warn(
                `Remove contact group failed: group ${contactGroupId} not found for user ${userId}`,
            );
            throw new ContactGroupNotFoundException();
        }

        // Just leave the group (same as leaveContactGroup)
        return this.leaveContactGroup(userId, contactGroupId);
    }
}
