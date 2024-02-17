import { SchemaFactory } from '@nestjs/mongoose';
import { Message } from './message.schema';
import { Contact as ZodContact } from '../../shared/contact.contract';

export class Contact implements ZodContact {
  _id: any;

  name: string;

  lastMessage?: Message;

  avatarFileName?: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
