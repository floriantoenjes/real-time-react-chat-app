import { Injectable, Logger } from '@nestjs/common';
import { Contact } from '../../shared/contact.contract';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { OnlineStatusService } from './online-status.service';
import { UserNotFoundException } from '../errors/internal/user-not-found.exception';
import { ContactNotFoundException } from '../errors/internal/contact-not-found.exception';
import { ContactAlreadyExistsException } from '../errors/internal/contact-already-exists.exception';

@Injectable()
export class ContactService {
    private readonly logger = new Logger(ContactService.name);

    constructor(
        private readonly onlineStatusService: OnlineStatusService,
        @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    ) {}

    async getUserContacts(userId: string) {
        const user = await this.userModel.findOne({
            _id: userId,
        });

        if (!user) {
            throw new UserNotFoundException();
        }

        const userContacts = user.contacts ?? [];
        if (userContacts.length === 0) {
            return [];
        }

        const contactIds = userContacts.map((contact) => contact._id);
        const contactUsers = await this.userModel
            .find({ _id: { $in: contactIds } })
            .lean();

        const contactUserMap = new Map(
            contactUsers.map((cu) => [cu._id.toString(), cu]),
        );

        const contacts: Contact[] = [];
        for (const contact of userContacts) {
            const contactUser = contactUserMap.get(contact._id);

            if (!contactUser) {
                throw new ContactNotFoundException();
            }

            contacts.push({
                ...contact,
                ...contactUser,
                lastMessage: contact.lastMessage,
            });
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

        if (!user) {
            throw new UserNotFoundException();
        }

        const contact = await this.userModel.findOne({
            _id: newContactId,
        });

        if (!contact) {
            throw new ContactNotFoundException();
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
            throw new ContactAlreadyExistsException();
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
            throw new UserNotFoundException();
        }

        const contact = user.contacts.find((uc) => uc._id === contactId);
        if (!contact) {
            throw new ContactNotFoundException();
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
