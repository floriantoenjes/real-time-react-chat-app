import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Message as ZodMessage } from '../../shared/message.contract';

@Schema()
export class Message implements ZodMessage {
  _id: any;

  @Prop({ required: true })
  fromUserId: string;

  @Prop({ required: true })
  toUserId: string;

  @Prop({ required: true })
  at: Date;

  @Prop({ required: true })
  message: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
