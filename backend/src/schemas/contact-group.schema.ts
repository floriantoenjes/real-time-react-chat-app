import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { MessageEntity } from './message.schema';
import { ContactGroup } from '../../shared/contact-group.contract';

export class ContactGroupEntity implements ContactGroup {
    _id: any;

    @Prop()
    memberIds!: string[];

    @Prop()
    name!: string;

    @Prop()
    lastMessage!: MessageEntity;
}

export const ContactGroupSchema =
    SchemaFactory.createForClass(ContactGroupEntity);
