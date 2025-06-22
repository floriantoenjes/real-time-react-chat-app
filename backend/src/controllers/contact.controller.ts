import { Controller, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { UserEntity } from '../schemas/user.schema';
import { Contact, contactContract } from '../../shared/contact.contract';
import { ContactService } from '../services/contact.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CustomLogger } from '../logging/custom-logger';
import { OnlineStatusService } from 'src/services/online-status.service';

@Controller()
export class ContactController {
    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
        @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
        private readonly contactService: ContactService,
        private readonly logger: CustomLogger,
        private readonly onlineStatusService: OnlineStatusService,
    ) {}

    @TsRestHandler(contactContract.getContacts)
    async getContacts() {
        return tsRestHandler(contactContract.getContacts, async ({ body }) => {
            return {
                status: 200,
                body: await this.contactService.getUserContacts(body.userId),
            };
        });
    }

    @TsRestHandler(contactContract.addContact)
    async addContact() {
        return tsRestHandler(contactContract.addContact, async ({ body }) => {
            const user = await this.userModel.findOne({ _id: body.userId });
            const contact = await this.userModel.findOne({
                _id: body.newContactId,
            });

            if (!user || !contact) {
                return { status: 404, body: false };
            }

            const newContact = {
                _id: body.newContactId,
                name: contact.username,
                avatarFileName: contact.avatarFileName,
            } as Contact;

            const contactAlreadyExists = user.contacts.find(
                (uc) => uc._id === newContact._id,
            );
            if (contactAlreadyExists) {
                this.logger.warn(
                    `User ${body.userId} tried to add already existing contact ${body.newContactId}`,
                );
                return { status: 400, body: false };
            }

            user.contacts.push(newContact);
            user.markModified('contacts');

            await user.save();

            return {
                status: 201,
                body: newContact,
            };
        });
    }

    @TsRestHandler(contactContract.removeContact)
    async removeContact() {
        return tsRestHandler(
            contactContract.removeContact,
            async ({ body }) => {
                const user = await this.userModel.findOne({ _id: body.userId });
                if (!user) {
                    return { status: 404, body: false };
                }

                const contact = user.contacts.find(
                    (uc) => uc._id === body.contactId,
                );
                if (!contact) {
                    return { status: 404, body: false };
                }

                user.contacts = user.contacts.filter(
                    (u) => u._id !== body.contactId,
                );
                user.markModified('contacts');

                await user.save();

                return {
                    status: 204,
                    body: true,
                };
            },
        );
    }

    @TsRestHandler(contactContract.getContactsOnlineStatus)
    async getContactsOnlineStatus() {
        return tsRestHandler(
            contactContract.getContactsOnlineStatus,
            async ({ body }) => {
                const onlineStatusMapObject = {};
                for (const userId of body) {
                    onlineStatusMapObject[userId] =
                        this.onlineStatusService.isUserOnline(userId);
                }

                return {
                    status: 200,
                    body: onlineStatusMapObject,
                };
            },
        );
    }
}
