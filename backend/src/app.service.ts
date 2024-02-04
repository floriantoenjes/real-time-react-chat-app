import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Message } from './schemas/message.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Contact } from './schemas/contact.schema';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Contact.name) private readonly contactModel: Model<Contact>,
  ) {}

  async onApplicationBootstrap() {
    await this.messageModel.deleteMany({});
    await this.userModel.deleteMany({});
    await this.contactModel.deleteMany({});

    const user1 = {
      username: 'Florian',
      email: 'florian@email.com',
      password: 'password',
    } as User;
    const user1Doc = await this.userModel.create(user1);

    const user2 = {
      username: 'Alex',
      email: 'alex@email.com',
      password: 'password',
    } as User;
    const user2Doc = await this.userModel.create(user2);

    const user1Contacts = [
      {
        userId: user2Doc._id.toString(),
        username: user2Doc.username,
      } as Contact,
    ];
    const user2Contacts = [
      {
        userId: user1Doc._id.toString(),
        username: user1Doc.username,
      } as Contact,
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
