import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RealTimeChatGateway } from './socket.gateway';
import { Message } from './schemas/message.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '../shared/contract';
import { Contact } from './schemas/contact.schema';
import { User } from './schemas/user.schema';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly gateway: RealTimeChatGateway,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Contact.name) private contactModel: Model<Contact>,
  ) {}

  @Get()
  getHello(): string {
    this.gateway.connectedSocketsMap
      .get('florian')
      .emit('message', 'Hello world!');
    return this.appService.getHello();
  }

  @TsRestHandler(contract.getMessages)
  async getMessages() {
    return tsRestHandler(contract.getMessages, async ({ body }) => {
      const messages = await this.messageModel
        .find({ from: body.username })
        .lean();
      return { status: 200, body: messages };
    });
  }

  @TsRestHandler(contract.deleteMessages)
  async deleteMessages() {
    return tsRestHandler(contract.deleteMessages, async ({ body }) => {
      await this.messageModel.deleteMany({ from: body.username });
      return { status: 200, body: true };
    });
  }

  @TsRestHandler(contract.sendMessage)
  async sendMessage() {
    return tsRestHandler(contract.sendMessage, async ({ body }) => {
      const newMessage = new Message();
      newMessage.message = body.message;
      newMessage.from = body.userIdAuthor;
      newMessage.at = new Date();

      const user = await this.userModel.findOne({ _id: body.userIdAuthor });
      user.contacts
        .find((c) => c.userId === body.from)
        .messages.push(newMessage);
      user.markModified('contacts');
      const result = await user.save();

      // this.gateway.connectedSocketsMap
      //   .get(body.from.toLowerCase())
      //   .emit('message', body.message);
      return { status: 201, body: true };
    });
  }

  @TsRestHandler(contract.getContacts)
  async getContacts() {
    return tsRestHandler(contract.getContacts, async ({ body }) => {
      const user = await this.userModel.findOne({
        _id: body.userId,
      });

      return {
        status: 200,
        body: user.contacts,
      };
    });
  }

  @TsRestHandler(contract.signIn)
  async signIn() {
    return tsRestHandler(contract.signIn, async ({ body }) => {
      const user = await this.userModel.findOne({
        email: body.email,
        password: body.password,
      });

      if (!user) {
        return {
          status: 403,
          body: false,
        };
      }

      return {
        status: 200,
        body: user,
      };
    });
  }
}
