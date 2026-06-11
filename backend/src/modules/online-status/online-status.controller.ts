import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { onlineStatusContract } from '../../../shared/online-status.contract';
import { OnlineStatusService } from './online-status.service';

@Controller()
export class OnlineStatusController {
    constructor(private readonly onlineStatusService: OnlineStatusService) {}

    @TsRestHandler(onlineStatusContract.getContactsOnlineStatus)
    async getContacts() {
        return tsRestHandler(
            onlineStatusContract.getContactsOnlineStatus,
            async ({ body }) => {
                return this.onlineStatusService.getContactsOnlineStatus(body);
            },
        );
    }
}
