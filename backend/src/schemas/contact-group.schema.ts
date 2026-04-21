import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ContactGroup } from '../../shared/contact-group.contract';

@Schema({ collection: 'contactGroups' })
export class ContactGroupEntity implements ContactGroup {
    _id: any;

    @Prop({ required: true })
    memberRefs!: Array<{ memberId: string; memberName: string }>;

    @Prop({ required: true })
    name!: string;

    @Prop()
    lastMessage?: string;

    @Prop({ required: true, type: 'object' })
    createdBy!: { creatorId: string; creatorName: string };

    @Prop({ required: true, default: () => new Date() })
    createdAt!: Date;

    @Prop({ required: true })
    isAccepted: boolean = false; // TODO: Don't use isAccepted here!
}

export const ContactGroupSchema =
    SchemaFactory.createForClass(ContactGroupEntity);

// Index on memberIds for efficient duplicate lookup
ContactGroupSchema.index({ memberIds: 1 });
