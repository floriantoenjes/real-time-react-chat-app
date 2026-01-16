import { Controller, Req } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contactGroupContract } from '../../shared/contact-group.contract';
import { ContactGroupService } from '../services/contact-group.service';
import { CustomLogger } from '../logging/custom-logger';
import { Request } from 'express';

@Controller()
export class ContactGroupController {
    constructor(
        private readonly contactGroupService: ContactGroupService,
        private readonly logger: CustomLogger,
    ) {
        this.logger.setContext(ContactGroupController.name);
    }

    @TsRestHandler(contactGroupContract.getContactGroups)
    async getContactGroups(@Req() req: Request) {
        const userId = req['user'].sub;
        return tsRestHandler(
            contactGroupContract.getContactGroups,
            async () => {
                return this.contactGroupService.getContactGroups(userId);
            },
        );
    }

    @TsRestHandler(contactGroupContract.addContactGroup)
    async addContactGroup(@Req() req: Request) {
        const userId = req['user'].sub;
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
    async removeContactGroup(@Req() req: Request) {
        const userId = req['user'].sub;
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
