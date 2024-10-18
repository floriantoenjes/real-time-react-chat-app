import { Injectable } from '@nestjs/common';
import { Contact } from '../../shared/contact.contract';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from '../schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class ContactService {
    constructor(
        @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    ) {}

    async getUserContacts(userId: string) {
        const user = await this.userModel.findOne({
            _id: userId,
        });

        const contacts: Contact[] = [];
        for (const contact of user?.contacts ?? []) {
            const contactUser = await this.userModel
                .findOne({ _id: contact._id })
                .lean();
            if (contactUser) {
                contacts.push({ ...contact, ...contactUser });
            }
        }

        return contacts;
    }

    async getUsersThatHaveContact(contactUserId: string) {
        return this.userModel
            .find({
                'contacts._id': contactUserId,
            })
            .lean();
    }
}
