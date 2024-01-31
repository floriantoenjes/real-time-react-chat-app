import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Message } from './schemas/message.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {}

  async onApplicationBootstrap() {
    await this.messageModel.deleteMany({});
  }

  getHello(): string {
    return 'Hello World!';
  }
}
