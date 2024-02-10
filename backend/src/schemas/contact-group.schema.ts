import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Message } from './message.schema';

@Schema()
export class ContactGroup {
  _id: any;

  @Prop()
  memberIds: string[];

  @Prop()
  groupName: string;

  @Prop()
  lastMessage: Message;
}

export const ContactGroupSchema = SchemaFactory.createForClass(ContactGroup);
