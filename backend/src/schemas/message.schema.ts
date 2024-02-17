import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Message } from '../../shared/message.contract';

@Schema({ collection: 'messages' })
export class MessageEntity implements Message {
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

export const MessageSchema = SchemaFactory.createForClass(MessageEntity);
