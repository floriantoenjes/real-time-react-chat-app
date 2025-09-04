import { SchemaFactory } from '@nestjs/mongoose';
import { Contact } from '../../shared/contact.contract';

export class ContactEntity implements Contact {
    _id: any;

    name!: string;

    lastMessage?: string;

    avatarFileName?: string;
}

export const ContactSchema = SchemaFactory.createForClass(ContactEntity);
