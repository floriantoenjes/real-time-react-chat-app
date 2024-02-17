import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

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
  contactIds: string[];

  @Prop()
  avatarFileName?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
