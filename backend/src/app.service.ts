import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { MessageEntity } from './schemas/message.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from './schemas/user.schema';
import { ContactEntity } from './schemas/contact.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(MessageEntity.name)
    private readonly messageModel: Model<MessageEntity>,
    @InjectModel(UserEntity.name) private readonly userModel: Model<UserEntity>,
  ) {}

  async onApplicationBootstrap() {
    await this.messageModel.deleteMany({});
    await this.userModel.deleteMany({});
    // await this.contactModel.deleteMany({});

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
  }

  getHello(): string {
    return 'Hello World!';
  }
}
