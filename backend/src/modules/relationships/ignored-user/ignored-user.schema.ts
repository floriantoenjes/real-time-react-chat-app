import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'ignoredUsers' })
export class IgnoredUserEntity {
    _id: any;

    @Prop({ required: true, index: true })
    userId!: string;

    @Prop({ required: true, index: true })
    ignoredUserId!: string;

    @Prop({ default: Date.now })
    createdAt!: Date;
}

export const IgnoredUserSchema =
    SchemaFactory.createForClass(IgnoredUserEntity);

IgnoredUserSchema.index({ userId: 1, ignoredUserId: 1 }, { unique: true });
