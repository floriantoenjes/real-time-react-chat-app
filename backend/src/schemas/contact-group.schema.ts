import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { ContactGroup } from '../../shared/contact-group.contract';

export class ContactGroupEntity implements ContactGroup {
    _id: any;

    @Prop()
    memberIds!: string[];

    @Prop()
    name!: string;

    @Prop()
    lastMessage!: string;
}

export const ContactGroupSchema =
    SchemaFactory.createForClass(ContactGroupEntity);
