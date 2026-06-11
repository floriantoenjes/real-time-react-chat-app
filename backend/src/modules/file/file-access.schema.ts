import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'fileAccess' })
export class FileAccessEntity {
    _id: any;

    @Prop({ required: true })
    ownerId!: string;

    @Prop({ required: true })
    accessibleBy!: string[];

    @Prop({ required: true })
    storageId!: string;
}

export const FileAccessSchema = SchemaFactory.createForClass(FileAccessEntity);
