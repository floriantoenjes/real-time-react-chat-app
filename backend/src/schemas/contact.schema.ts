import { SchemaFactory } from '@nestjs/mongoose';
import { Message } from './message.schema';

export class Contact {
  _id: any;

  name: string;

  lastMessage?: Message;

  avatarFileName?: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
