import { Inject, Injectable } from '@nestjs/common';
import { Contact } from '../../shared/contact.contract';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ContactService {
    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
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
                contacts.push({
                    ...contact,
                    ...contactUser,
                    lastMessage: contact.lastMessage,
                });
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
