import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RealTimeChatGateway } from './socket.gateway';
import { Message } from './schemas/message.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contract } from '../shared/contract';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly gateway: RealTimeChatGateway,
    @InjectModel(Message.name) private messageModel: Model<Message>,
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
      await this.messageModel.create({
        message: body.message,
        from: body.from,
        at: new Date(),
      });

      this.gateway.connectedSocketsMap
        .get(body.from)
        .emit('message', body.message);
      return { status: 201, body: true };
    });
  }
}
