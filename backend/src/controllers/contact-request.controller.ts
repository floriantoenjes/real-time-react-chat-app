import { Controller, Logger } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { UserId } from '../decorators/user-id.decorator';
import { contactRequestContract } from '../../shared/contact-request.contract';
import { ContactRequestService } from '../services/contact-request.service';

@Controller()
export class ContactRequestController {
    private readonly logger = new Logger(ContactRequestController.name);

    constructor(
        private readonly contactRequestService: ContactRequestService,
    ) {}

    @TsRestHandler(contactRequestContract.getContactRequestByInitiatorId)
    async getContactRequestByInitiatorAndTargetUserIds(
        @UserId() userId: string,
    ) {
        return tsRestHandler(
            contactRequestContract.getContactRequestByInitiatorId,
            async ({ body }) => {
                return {
                    status: 200 as const,
                    body: await this.contactRequestService.getContactRequestByInitiatorAndTargetUserIds(
                        body.initiatorId,
                        userId,
                    ),
                };
            },
        );
    }

    @TsRestHandler(contactRequestContract.respondToContactRequest)
    async respondToContactRequest() {
        return tsRestHandler(
            contactRequestContract.respondToContactRequest,
            async ({ body }) => {
                await this.contactRequestService.respondToContactRequest(
                    body.contactRequestId,
                    body.accepted,
                );
                return {
                    status: 200 as const,
                    body: undefined,
                };
            },
        );
    }
}
