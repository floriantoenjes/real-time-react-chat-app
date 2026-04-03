import { ContactRequest } from '../../shared/contact-request.contract';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'contactRequests' })
export class ContactRequestEntity implements ContactRequest {
    _id: any;

    @Prop({ required: true })
    initiatorId!: string;

    @Prop({ required: true })
    sentAt!: Date;

    @Prop({ required: true })
    targetUserId!: string;
}

export const ContactRequestSchema =
    SchemaFactory.createForClass(ContactRequestEntity);
