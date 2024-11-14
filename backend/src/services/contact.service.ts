import { Inject, Injectable } from '@nestjs/common';
import { Contact } from '../../shared/contact.contract';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { getUserContactsCacheKey } from '../cache/cache-keys';

@Injectable()
export class ContactService {
    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
        @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    ) {}

    async getUserContacts(userId: string) {
        const cacheKey = getUserContactsCacheKey(userId);
        const cachedUserContacts = await this.cache.get<Contact[]>(cacheKey);
        if (cachedUserContacts) {
            return cachedUserContacts;
        }

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

        await this.cache.set(cacheKey, contacts);

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
