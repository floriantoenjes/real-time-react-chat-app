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
import { ContactEntity } from './schemas/contact.schema';
import * as bcrypt from 'bcrypt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AppService implements OnApplicationBootstrap {
    private readonly logger = new Logger(AppService.name);

    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
        @InjectModel(MessageEntity.name)
        private readonly messageModel: Model<MessageEntity>,
        @InjectModel(UserEntity.name)
        private readonly userModel: Model<UserEntity>,
    ) {}

    async onApplicationBootstrap() {
        await this.cache.reset();

        this.logger.log('Deleting all messages...');
        await this.messageModel.deleteMany({});
        this.logger.log('All messages have been deleted.');

        this.logger.log('Deleting all users...');
        await this.userModel.deleteMany({});
        this.logger.log('All users have been deleted.');

        if (await this.userModel.findOne()) {
            return;
        }

        const saltOrRounds = 10;
        const password = await bcrypt.hash('password', saltOrRounds);

        const user1 = {
            username: 'Florian',
            email: 'florian@email.com',
            password,
            avatarFileName: 'avatar1.svg',
        } as UserEntity;
        const user1Doc = await this.userModel.create(user1);

        const user2 = {
            username: 'Alex',
            email: 'alex@email.com',
            password,
            avatarFileName: 'avatar3.svg',
        } as UserEntity;
        const user2Doc = await this.userModel.create(user2);

        const user3 = {
            username: 'Tom',
            email: 'tom@email.com',
            password,
            avatarFileName: 'avatar2.svg',
        } as UserEntity;
        const user3Doc = await this.userModel.create(user3);

        const user4 = {
            username: 'Stella',
            email: 'stella@email.com',
            password,
            avatarFileName: 'avatar4.svg',
        } as UserEntity;
        const user4Doc = await this.userModel.create(user4);

        const user1Contacts: ContactEntity[] = [
            {
                _id: user2Doc._id.toString(),
                name: user2.username,
                avatarFileName: user2.avatarFileName,
            },
        ];
        const user2Contacts: ContactEntity[] = [
            {
                _id: user1Doc._id.toString(),
                name: user1.username,
                avatarFileName: user1.avatarFileName,
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
