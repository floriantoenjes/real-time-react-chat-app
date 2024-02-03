import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Message } from './message.schema';

@Schema()
export class Contact {
  @Prop()
  userId: string;

  @Prop()
  username: string;

  @Prop()
  lastMessage: Message;

  @Prop()
  messages: Message[];
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
