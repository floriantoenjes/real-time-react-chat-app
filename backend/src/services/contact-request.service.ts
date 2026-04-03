import { Injectable } from '@nestjs/common';
import { ContactRequest } from '../../shared/contact-request.contract';
import { InjectModel } from '@nestjs/mongoose';
import { ContactRequestEntity } from '../schemas/contact-request.schema';
import { Model } from 'mongoose';
import { UserEntity } from '../schemas/user.schema';
import { UserNotFoundException } from '../errors/internal/user-not-found.exception';
import { ObjectNotFoundException } from '../errors/internal/object-not-found.exception';
import { ContactNotFoundException } from '../errors/internal/contact-not-found.exception';

@Injectable()
export class ContactRequestService {
    constructor(
        @InjectModel(ContactRequestEntity.name)
        private readonly contactRequestModel: Model<ContactRequestEntity>,
        @InjectModel(UserEntity.name)
        private readonly userModel: Model<UserEntity>,
    ) {}

    public async getContactRequestByInitiatorAndTargetUserIds(
        initiatorId: string,
        targetUserId: string,
    ): Promise<ContactRequest> {
        const initiator = await this.userModel.findById(initiatorId).lean();
        if (!initiator) {
            throw new UserNotFoundException();
        }
        const targetUser = await this.userModel.findById(targetUserId).lean();
        if (!targetUser) {
            throw new UserNotFoundException();
        }

        const contactRequest = await this.contactRequestModel.findOne({
            initiatorId: initiatorId,
            targetUserId: targetUserId,
        });
        if (!contactRequest) {
            throw new ObjectNotFoundException();
        }

        return contactRequest;
    }

    public async respondToContactRequest(
        contactRequestId: string,
        accepted: boolean,
    ): Promise<void> {
        const contactRequest =
            await this.contactRequestModel.findById(contactRequestId);
        if (!contactRequest) {
            throw new ObjectNotFoundException();
        }

        const targetUser = await this.userModel.findById(
            contactRequest.targetUserId,
        );
        if (!targetUser) {
            throw new UserNotFoundException();
        }

        const initiatorContact = targetUser.contacts.find(
            (contact) => contact._id === contactRequest.initiatorId,
        );
        if (!initiatorContact) {
            throw new ContactNotFoundException();
        }

        if (accepted) {
            initiatorContact.isAccepted = true;
            targetUser.markModified('contacts');
            await targetUser.save();
            await contactRequest.deleteOne();
        } else {
            targetUser.contacts = targetUser.contacts.filter(
                (contact) => contact !== initiatorContact,
            );
            targetUser.markModified('contacts');
            await targetUser.save();
        }
    }
}
