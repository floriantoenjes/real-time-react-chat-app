import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ContactGroup } from '../../shared/contact-group.contract';

@Schema({ collection: 'contactGroups' })
export class ContactGroupEntity implements ContactGroup {
    _id: any;

    @Prop({ required: true })
    memberIds!: string[];

    @Prop({ required: true })
    name!: string;

    @Prop()
    lastMessage!: string;

    @Prop({ required: true })
    createdBy!: string;

    @Prop({ required: true, default: () => new Date() })
    createdAt!: Date;
}

export const ContactGroupSchema =
    SchemaFactory.createForClass(ContactGroupEntity);

// Index on memberIds for efficient duplicate lookup
ContactGroupSchema.index({ memberIds: 1 });
