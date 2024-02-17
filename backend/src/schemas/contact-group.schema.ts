import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Message } from './message.schema';
import { ContactGroup as ZodContactGroup } from '../../shared/contact-group.contract';

@Schema()
export class ContactGroup implements ZodContactGroup {
  _id: any;

  @Prop()
  memberIds: string[];

  @Prop()
  name: string;

  @Prop()
  lastMessage: Message;
}

export const ContactGroupSchema = SchemaFactory.createForClass(ContactGroup);
