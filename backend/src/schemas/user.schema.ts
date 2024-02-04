import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Contact } from './contact.schema';

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
}

export const UserSchema = SchemaFactory.createForClass(User);
