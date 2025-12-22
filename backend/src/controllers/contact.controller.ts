import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contactContract } from '../../shared/contact.contract';
import { ContactService } from '../services/contact.service';
import { CustomLogger } from '../logging/custom-logger';

@Controller()
export class ContactController {
    constructor(
        private readonly contactService: ContactService,
        private readonly logger: CustomLogger,
    ) {
        this.logger.setContext(ContactController.name);
    }

    @TsRestHandler(contactContract.getContacts)
    async getContacts() {
        return tsRestHandler(contactContract.getContacts, async ({ body }) => {
            return {
                status: 200 as const,
                body: await this.contactService.getUserContacts(body.userId),
            };
        });
    }

    @TsRestHandler(contactContract.addContact)
    async addContact() {
        return tsRestHandler(contactContract.addContact, async ({ body }) => {
            return this.contactService.addContact(
                body.userId,
                body.newContactId,
            );
        });
    }

    @TsRestHandler(contactContract.removeContact)
    async removeContact() {
        return tsRestHandler(
            contactContract.removeContact,
            async ({ body }) => {
                return this.contactService.removeContact(
                    body.userId,
                    body.contactId,
                );
            },
        );
    }

    @TsRestHandler(contactContract.getContactsOnlineStatus)
    async getContactsOnlineStatus() {
        return tsRestHandler(
            contactContract.getContactsOnlineStatus,
            async ({ body }) => {
                return this.contactService.getContactsOnlineStatus(body);
            },
        );
    }
}
