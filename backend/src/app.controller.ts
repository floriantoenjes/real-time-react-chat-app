import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { RealTimeChatGateway } from './socket.gateway';
import { Message } from './schemas/message.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

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

  @Post('get-messages')
  async getMessages(@Body() body: { username: string }): Promise<Message[]> {
    return this.messageModel.find({ from: body.username }).lean();
  }

  @Post('send')
  async sendMessage(
    @Body() body: { message: string; username: string },
  ): Promise<void> {
    await this.messageModel.create({
      message: body.message,
      from: body.username,
      at: new Date(),
    });

    this.gateway.connectedSocketsMap
      .get(body.username)
      .emit('message', body.message);

    return;
  }
}
