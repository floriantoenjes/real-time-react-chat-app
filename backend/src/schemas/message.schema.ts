import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Message } from '../../shared/message.contract';

@Schema({ collection: 'messages' })
export class MessageEntity implements Message {
  _id: any;

  @Prop()
  fromUserId: string;

  @Prop()
  toUserId: string;

  @Prop()
  at: Date;

  @Prop()
  message: string;

  @Prop()
  read: boolean;

  @Prop({ default: true })
  sent: boolean = true;
}

export const MessageSchema = SchemaFactory.createForClass(MessageEntity);
