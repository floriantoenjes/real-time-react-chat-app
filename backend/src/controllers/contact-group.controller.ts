import { Controller, Logger } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { contactGroupContract } from '../../shared/contact-group.contract';
import { ContactGroupService } from '../services/contact-group.service';
import { UserId } from '../decorators/user-id.decorator';

@Controller()
export class ContactGroupController {
    private readonly logger = new Logger(ContactGroupController.name);

    constructor(private readonly contactGroupService: ContactGroupService) {}

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

    @TsRestHandler(contactGroupContract.leaveContactGroup)
    async leaveContactGroup(@UserId() userId: string) {
        return tsRestHandler(
            contactGroupContract.leaveContactGroup,
            async ({ body }) => {
                return this.contactGroupService.leaveContactGroup(
                    userId,
                    body.contactGroupId,
                );
            },
        );
    }

    @TsRestHandler(contactGroupContract.rejoinContactGroup)
    async rejoinContactGroup(@UserId() userId: string) {
        return tsRestHandler(
            contactGroupContract.rejoinContactGroup,
            async ({ body }) => {
                return this.contactGroupService.rejoinContactGroup(
                    userId,
                    body.contactGroupId,
                );
            },
        );
    }

    @TsRestHandler(contactGroupContract.getLeftGroups)
    async getLeftGroups(@UserId() userId: string) {
        return tsRestHandler(contactGroupContract.getLeftGroups, async () => {
            return this.contactGroupService.getLeftGroups(userId);
        });
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
