import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contactGroupContract } from '../../shared/contact-group.contract';
import { ContactGroupService } from '../services/contact-group.service';
import { CustomLogger } from '../logging/custom-logger';
import { UserId } from '../decorators/user-id.decorator';

@Controller()
export class ContactGroupController {
    constructor(
        private readonly contactGroupService: ContactGroupService,
        private readonly logger: CustomLogger,
    ) {
        this.logger.setContext(ContactGroupController.name);
    }

    @TsRestHandler(contactGroupContract.getContactGroups)
    async getContactGroups(@UserId() userId: string) {
        return tsRestHandler(
            contactGroupContract.getContactGroups,
            async () => {
                return this.contactGroupService.getContactGroups(userId);
            },
        );
    }

    @TsRestHandler(contactGroupContract.addContactGroup)
    async addContactGroup(@UserId() userId: string) {
        return tsRestHandler(
            contactGroupContract.addContactGroup,
            async ({ body }) => {
                return this.contactGroupService.addContactGroup(
                    userId,
                    body.name,
                    body.memberIds,
                );
            },
        );
    }

    @TsRestHandler(contactGroupContract.removeContactGroup)
    async removeContactGroup(@UserId() userId: string) {
        return tsRestHandler(
            contactGroupContract.removeContactGroup,
            async ({ body }) => {
                return this.contactGroupService.removeContactGroup(
                    userId,
                    body.contactGroupId,
                );
            },
        );
    }
}
