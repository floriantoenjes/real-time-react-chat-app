import {
    Inject,
    Injectable,
    Logger,
    OnApplicationBootstrap,
} from '@nestjs/common';
import { MessageEntity } from './schemas/message.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ContactGroupEntity } from './schemas/contact-group.schema';
import { FileAccessEntity } from './schemas/file-access.schema';
import { ContactRequestEntity } from './schemas/contact-request.schema';
import { IgnoredUserEntity } from './schemas/ignored-user.schema';
import { AuthUserEntity } from './modules/auth/auth.schema';
import { ContactEntity } from './schemas/contact.schema';

@Injectable()
export class AppService implements OnApplicationBootstrap {
    private readonly logger = new Logger(AppService.name);

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

    getHello(): string {
        return 'Hello World!';
    }
}
