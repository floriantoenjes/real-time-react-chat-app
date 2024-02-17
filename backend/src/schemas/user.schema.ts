import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ContactGroup } from '../../shared/contact-group.contract';
import { Contact } from '../../shared/contact.contract';
import { User as ZodUser } from '../../shared/user.contract';

@Schema()
export class User implements ZodUser {
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

  @Prop()
  avatarFileName?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
