import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Message } from './message.schema';

@Schema()
export class Contact {
  _id: any;

  @Prop()
  userId: string;

  @Prop()
  username: string;

  @Prop()
  lastMessage: Message;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
