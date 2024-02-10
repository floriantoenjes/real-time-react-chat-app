import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Contact } from './contact.schema';
import { ContactGroup } from './contact-group.schema';

@Schema()
export class User {
  _id: any;

  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop()
  username: string;

  @Prop()
  contacts: Contact[];

  @Prop()
  contactGroups: ContactGroup[];
}

export const UserSchema = SchemaFactory.createForClass(User);
