import { Injectable } from '@nestjs/common';
import { Contact } from '../../shared/contact.contract';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { CustomLogger } from '../logging/custom-logger';
import { OnlineStatusService } from './online-status.service';

@Injectable()
export class ContactService {
    constructor(
        private readonly logger: CustomLogger,
        private readonly onlineStatusService: OnlineStatusService,
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

    async addContact(userId: string, newContactId: string) {
        const user = await this.userModel.findOne({ _id: userId });
        const contact = await this.userModel.findOne({
            _id: newContactId,
        });

        if (!user || !contact) {
            return { status: 404 as const, body: false };
        }

        const newContact = {
            _id: newContactId,
            name: contact.username,
            avatarFileName: contact.avatarFileName,
        } as Contact;

        const contactAlreadyExists = user.contacts.find(
            (uc) => uc._id === newContact._id,
        );
        if (contactAlreadyExists) {
            this.logger.warn(
                `User ${userId} tried to add already existing contact ${newContactId}`,
            );
            return { status: 400 as const, body: false };
        }

        user.contacts.push(newContact);
        user.markModified('contacts');

        await user.save();

        return {
            status: 201 as const,
            body: newContact,
        };
    }

    async removeContact(userId: string, contactId: string) {
        const user = await this.userModel.findOne({ _id: userId });
        if (!user) {
            return { status: 404 as const, body: false };
        }

        const contact = user.contacts.find((uc) => uc._id === contactId);
        if (!contact) {
            return { status: 404 as const, body: false };
        }

        user.contacts = user.contacts.filter((u) => u._id !== contactId);
        user.markModified('contacts');

        await user.save();

        return {
            status: 204 as const,
            body: true,
        };
    }

    async getContactsOnlineStatus(body: string[]) {
        const onlineStatusMapObject = {};
        for (const userId of body) {
            onlineStatusMapObject[userId] =
                this.onlineStatusService.isUserOnline(userId);
        }

        return {
            status: 200 as const,
            body: onlineStatusMapObject,
        };
    }
}
