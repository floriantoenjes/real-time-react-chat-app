import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema()
export class Message {
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
