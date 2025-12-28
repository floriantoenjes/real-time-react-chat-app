import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contactGroupContract } from '../../shared/contact-group.contract';
import { ContactGroupService } from '../services/contact-group.service';
import { CustomLogger } from '../logging/custom-logger';

@Controller()
export class ContactGroupController {
    constructor(
        private readonly contactGroupService: ContactGroupService,
        private readonly logger: CustomLogger,
    ) {
        this.logger.setContext(ContactGroupController.name);
    }

    @TsRestHandler(contactGroupContract.getContactGroups)
    async getContactGroups() {
        return tsRestHandler(
            contactGroupContract.getContactGroups,
            async ({ body }) => {
                return this.contactGroupService.getContactGroups(body.userId);
            },
        );
    }

    @TsRestHandler(contactGroupContract.addContactGroup)
    async addContactGroup() {
        return tsRestHandler(
            contactGroupContract.addContactGroup,
            async ({ body }) => {
                return this.contactGroupService.addContactGroup(
                    body.userId,
                    body.name,
                    body.memberIds,
                );
            },
        );
    }

    @TsRestHandler(contactGroupContract.removeContactGroup)
    async removeContactGroup() {
        return tsRestHandler(
            contactGroupContract.removeContactGroup,
            async ({ body }) => {
                return this.contactGroupService.removeContactGroup(
                    body.userId,
                    body.contactGroupId,
                );
            },
        );
    }
}
