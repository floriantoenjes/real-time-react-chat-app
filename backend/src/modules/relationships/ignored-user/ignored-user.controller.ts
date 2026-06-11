import { Controller, Logger } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { UserId } from '../../../decorators/user-id.decorator';
import { ignoredUserContract } from '../../../../shared/ignored-user.contract';
import { IgnoredUserService } from './ignored-user.service';

@Controller()
export class IgnoredUserController {
    private readonly logger = new Logger(IgnoredUserController.name);

    constructor(private readonly ignoredUserService: IgnoredUserService) {}

    @TsRestHandler(ignoredUserContract.ignoreUser)
    async ignoreUser(@UserId() userId: string) {
        return tsRestHandler(
            ignoredUserContract.ignoreUser,
            async ({ body }) => {
                await this.ignoredUserService.ignoreUser(
                    userId,
                    body.ignoredUserId,
                );
                return {
                    status: 201 as const,
                    body: undefined,
                };
            },
        );
    }

    @TsRestHandler(ignoredUserContract.unignoreUser)
    async unignoreUser(@UserId() userId: string) {
        return tsRestHandler(
            ignoredUserContract.unignoreUser,
            async ({ body }) => {
                await this.ignoredUserService.unignoreUser(
                    userId,
                    body.ignoredUserId,
                );
                return {
                    status: 200 as const,
                    body: undefined,
                };
            },
        );
    }

    @TsRestHandler(ignoredUserContract.getIgnoredUsers)
    async getIgnoredUsers(@UserId() userId: string) {
        return tsRestHandler(
            ignoredUserContract.getIgnoredUsers,
            async ({ query }) => {
                const pagination = {
                    page: query.page,
                    limit: query.limit,
                };
                const result = await this.ignoredUserService.getIgnoredUsers(
                    userId,
                    pagination,
                );
                return {
                    status: 200 as const,
                    body: result,
                };
            },
        );
    }
}
