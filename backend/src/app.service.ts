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
        messages: [],
      } as Contact,
    ];
    await this.contactModel.create(user1Contacts);

    const user2Contacts = [
      {
        userId: user1Doc._id.toString(),
        messages: [],
      } as Contact,
    ];
    await this.contactModel.create(user2Contacts);
  }

  getHello(): string {
    return 'Hello World!';
  }
}
