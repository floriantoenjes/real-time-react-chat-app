import { Controller, Req } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contactContract } from '../../shared/contact.contract';
import { ContactService } from '../services/contact.service';
import { CustomLogger } from '../logging/custom-logger';
import { Request } from 'express';

@Controller()
export class ContactController {
    constructor(
        private readonly contactService: ContactService,
        private readonly logger: CustomLogger,
    ) {
        this.logger.setContext(ContactController.name);
    }

    @TsRestHandler(contactContract.getContacts)
    async getContacts(@Req() req: Request) {
        const userId = req['user'].sub;
        return tsRestHandler(contactContract.getContacts, async () => {
            return {
                status: 200 as const,
                body: await this.contactService.getUserContacts(userId),
            };
        });
    }

    @TsRestHandler(contactContract.addContact)
    async addContact(@Req() req: Request) {
        const userId = req['user'].sub;
        return tsRestHandler(contactContract.addContact, async ({ body }) => {
            return this.contactService.addContact(userId, body.newContactId);
        });
    }

    @TsRestHandler(contactContract.removeContact)
    async removeContact(@Req() req: Request) {
        const userId = req['user'].sub;
        return tsRestHandler(
            contactContract.removeContact,
            async ({ body }) => {
                return this.contactService.removeContact(
                    userId,
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
