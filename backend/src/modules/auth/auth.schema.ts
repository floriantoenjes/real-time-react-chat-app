import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AuthUser } from '../../../shared/auth.contract';

@Schema({ collection: 'auth-users' })
export class AuthUserEntity implements AuthUser {
    _id: any;

    @Prop({ unique: true })
    email!: string;

    @Prop({ select: false })
    password!: string;

    @Prop()
    refreshTokenEncrypted?: string;
}

export const AuthUserSchema = SchemaFactory.createForClass(AuthUserEntity);
