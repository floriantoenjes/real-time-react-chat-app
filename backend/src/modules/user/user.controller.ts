import {
    Controller,
    Logger,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { userContract } from '../../../shared/user.contract';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { returnEntityOrNotFound } from '../../controllers/utils/controller-utils';
import { UserId } from '../../decorators/user-id.decorator';

@Controller()
export class UserController {
    private readonly logger = new Logger(UserController.name);

    constructor(private readonly userService: UserService) {}

    @TsRestHandler(userContract.getSignedInUser)
    async getSignedInUser(@UserId() userId: string) {
        return tsRestHandler(userContract.getSignedInUser, async () => {
            return returnEntityOrNotFound(
                await this.userService.getSignedInUser(userId),
            );
        });
    }

    @TsRestHandler(userContract.getAll)
    async getAll() {
        return tsRestHandler(userContract.getAll, async () => {
            return returnEntityOrNotFound(await this.userService.findUsersBy());
        });
    }

    @TsRestHandler(userContract.searchUserByUsername)
    async searchUserByUsername() {
        return tsRestHandler(
            userContract.searchUserByUsername,
            async ({ body }) => {
                return returnEntityOrNotFound(
                    await this.userService.findUserBy({
                        username: body.username,
                    }),
                );
            },
        );
    }

    @TsRestHandler(userContract.loadAvatar)
    async loadAvatar() {
        return tsRestHandler(userContract.loadAvatar, async ({ params }) => {
            return this.userService.loadAvatar(params.userId);
        });
    }

    @TsRestHandler(userContract.uploadAvatar)
    @UseInterceptors(FileInterceptor('avatar'))
    async updateUserAvatar(
        @UploadedFile() avatar: Express.Multer.File,
        @UserId() userId: string,
    ) {
        return tsRestHandler(userContract.uploadAvatar, async ({ body }) => {
            const x = +body.x;
            const y = +body.y;
            const width = +body.width;
            const height = +body.height;

            return this.userService.updateUserAvatar(
                userId,
                x,
                y,
                width,
                height,
                avatar,
            );
        });
    }
}
