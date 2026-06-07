import {
    Inject,
    Injectable,
    Logger,
    OnApplicationBootstrap,
} from '@nestjs/common';
import { AuthUserEntity } from '../auth/auth.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ContactGroupEntity } from '../contact-group/contact-group.schema';
import { ContactRequestEntity } from '../contact-request/contact-request.schema';
import { FileAccessEntity } from '../file/file-access.schema';
import { IgnoredUserEntity } from '../ignored-user/ignored-user.schema';
import { MessageEntity } from '../message/message.schema';
import { UserEntity } from '../user/user.schema';
import * as bcrypt from 'bcrypt';
import { ContactEntity } from '../contact/contact.schema';

@Injectable()
export class InitService implements OnApplicationBootstrap {
    private readonly logger = new Logger(InitService.name);

    constructor(
        @InjectModel(AuthUserEntity.name)
        private readonly authUserModel: Model<AuthUserEntity>,
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
        @InjectModel(ContactGroupEntity.name)
        private readonly contactGroupModel: Model<ContactGroupEntity>,
        @InjectModel(ContactRequestEntity.name)
        private readonly contactRequestModel: Model<ContactRequestEntity>,
        @InjectModel(FileAccessEntity.name)
        private readonly fileAccessModel: Model<FileAccessEntity>,
        @InjectModel(IgnoredUserEntity.name)
        private readonly ignoredUserModel: Model<IgnoredUserEntity>,
        @InjectModel(MessageEntity.name)
        private readonly messageModel: Model<MessageEntity>,
        @InjectModel(UserEntity.name)
        private readonly userModel: Model<UserEntity>,
    ) {}

    async onApplicationBootstrap() {
        await this.cache.clear();

        this.logger.log('Deleting all user ignores...');
        await this.ignoredUserModel.deleteMany({});
        this.logger.log('All user ignores have been deleted.');

        this.logger.log('Deleting all messages...');
        await this.messageModel.deleteMany({});
        this.logger.log('All messages have been deleted.');

        this.logger.log('Deleting all users...');
        await this.userModel.deleteMany({});
        this.logger.log('All users have been deleted.');

        this.logger.log('Deleting all auth users...');
        await this.authUserModel.deleteMany({});
        this.logger.log('All auth users have been deleted.');

        this.logger.log('Deleting all contact requests...');
        await this.contactRequestModel.deleteMany({});
        this.logger.log('All contact requests have been deleted.');

        this.logger.log('Deleting all contact groups...');
        await this.contactGroupModel.deleteMany({});
        this.logger.log('All contact groups have been deleted.');

        this.logger.log('Deleting all file access entities...');
        await this.fileAccessModel.deleteMany({});
        this.logger.log('All file access entities have been deleted.');

        if (await this.userModel.findOne()) {
            return;
        }

        const saltOrRounds = 10;
        const password = await bcrypt.hash('password', saltOrRounds);

        let authUser1 = {
            password,
            email: 'florian@email.com',
        } as AuthUserEntity;
        authUser1 = await this.authUserModel.create(authUser1);

        const user1 = {
            authUserId: authUser1._id,
            username: 'Florian',
            avatarFileName: 'avatar1.svg',
        } as UserEntity;
        const user1Doc = await this.userModel.create(user1);

        let authUser2 = {
            password,
            email: 'alex@email.com',
        } as AuthUserEntity;
        authUser2 = await this.authUserModel.create(authUser2);

        const user2 = {
            authUserId: authUser2._id,
            username: 'Alex',
            avatarFileName: 'avatar3.svg',
        } as UserEntity;
        const user2Doc = await this.userModel.create(user2);

        let authUser3 = {
            password,
            email: 'tom@email.com',
        } as AuthUserEntity;
        authUser3 = await this.authUserModel.create(authUser3);

        const user3 = {
            authUserId: authUser3._id,
            username: 'Tom',
            avatarFileName: 'avatar2.svg',
        } as UserEntity;
        const user3Doc = await this.userModel.create(user3);

        let authUser4 = {
            password,
            email: 'stella@email.com',
        } as AuthUserEntity;
        authUser4 = await this.authUserModel.create(authUser4);

        const user4 = {
            authUserId: authUser4._id,
            username: 'Stella',
            avatarFileName: 'avatar4.svg',
        } as UserEntity;
        const user4Doc = await this.userModel.create(user4);

        const user1Contacts: ContactEntity[] = [
            {
                _id: user2Doc._id.toString(),
                name: user2.username,
                avatarFileName: user2.avatarFileName,
                isAccepted: true,
            },
        ];
        const user2Contacts: ContactEntity[] = [
            {
                _id: user1Doc._id.toString(),
                name: user1.username,
                avatarFileName: user1.avatarFileName,
                isAccepted: true,
            },
        ];
        user1Doc.contacts = user1Contacts;
        user2Doc.contacts = user2Contacts;

        await user1Doc.save();
        await user2Doc.save();

        this.logger.log('Done setting up initial users and contacts.');
    }
}
