import { SchemaFactory } from '@nestjs/mongoose';
import { MessageEntity } from './message.schema';
import { Contact } from '../../shared/contact.contract';

export class ContactEntity implements Contact {
    _id: any;

    name!: string;

    lastMessage?: MessageEntity;

    avatarFileName?: string;
}

export const ContactSchema = SchemaFactory.createForClass(ContactEntity);
