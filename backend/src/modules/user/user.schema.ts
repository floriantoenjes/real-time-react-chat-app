import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Contact } from '../../../shared/contact.contract';
import { User } from '../../../shared/user.contract';

@Schema({ collection: 'users' })
export class UserEntity implements User {
    _id: any;

    @Prop({ required: true, unique: true, index: true })
    authUserId!: string;

    @Prop()
    username!: string;

    @Prop()
    contacts!: Contact[];

    @Prop({ default: [] })
    contactGroupIds!: string[];

    @Prop({ default: [] })
    leftGroupIds!: string[];

    @Prop()
    avatarFileName?: string;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);
