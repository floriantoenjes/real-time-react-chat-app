import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IgnoredUserEntity } from '../schemas/ignored-user.schema';

@Injectable()
export class UserRelationshipQueryService {
    private readonly logger = new Logger(UserRelationshipQueryService.name);

    constructor(
        @InjectModel(IgnoredUserEntity.name)
        private readonly ignoredUserModel: Model<IgnoredUserEntity>,
    ) {}

    /**
     * Check if a user is ignored by another user
     */
    public async isUserIgnored(
        userId: string,
        targetUserId: string,
    ): Promise<boolean> {
        const ignoreEntry = await this.ignoredUserModel.findOne({
            userId,
            ignoredUserId: targetUserId,
        });

        return !!ignoreEntry;
    }
}
