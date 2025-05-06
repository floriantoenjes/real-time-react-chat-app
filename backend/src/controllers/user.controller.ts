import {
    Body,
    Controller,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import {
    NestRequestShapes,
    TsRest,
    TsRestHandler,
    tsRestHandler,
    TsRestRequest,
} from '@ts-rest/nest';
import { userContract } from '../../shared/user.contract';
import { UserService } from '../services/user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectStorageService } from '../services/object-storage.service';
import { Public } from '../services/auth-constants';
import { Jimp } from 'jimp';
import { CustomLogger } from '../logging/custom-logger';
import { returnEntityOrNotFound } from './utils/controller-utils';

@Controller()
export class UserController {
    constructor(
        private readonly logger: CustomLogger,
        private readonly userService: UserService,
        private readonly objectStorageService: ObjectStorageService,
    ) {}

    @TsRestHandler(userContract.getAll)
    async getAll() {
        return tsRestHandler(userContract.getAll, async () => {
            return returnEntityOrNotFound(await this.userService.findUsersBy());
        });
    }

    @TsRestHandler(userContract.signIn)
    @Public()
    async signIn() {
        return tsRestHandler(userContract.signIn, async ({ body }) => {
            return returnEntityOrNotFound(
                await this.userService.signIn(body.email, body.password),
            );
        });
    }

    @TsRestHandler(userContract.refresh)
    @Public()
    async refresh() {
        return tsRestHandler(userContract.refresh, async ({ body }) => {
            const userAndFreshTokens = await this.userService.refresh(
                body.accessToken,
                body.refreshToken,
            );
            if (!userAndFreshTokens) {
                return { status: 401, body: 'Unauthorized' };
            }
            return { status: 200, body: userAndFreshTokens };
        });
    }

    @TsRestHandler(userContract.signUp)
    @Public()
    async signUp() {
        return tsRestHandler(userContract.signUp, async ({ body }) => {
            const newUser = await this.userService.createUser(
                body.email,
                body.password,
                body.username,
            );

            if (!newUser) {
                throw Error(
                    `New user with username ${body.username} could not be created`,
                );
            }

            const signInResponse = await this.userService.signIn(
                body.email,
                body.password,
            );
            if (!signInResponse) {
                throw new Error(
                    `Newly registered user with id ${newUser._id} could not be signed in`,
                );
            }
            const { accessToken, refreshToken } = signInResponse;

            return {
                status: 201,
                body: { user: newUser, accessToken, refreshToken },
            };
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
            try {
                const objectDataString =
                    await this.objectStorageService.loadFile(
                        params.userId + '_avatar',
                    );

                if (objectDataString) {
                    return {
                        status: 200,
                        body: objectDataString,
                    };
                }
            } catch (e) {}
            return {
                status: 404,
                body: false,
            };
        });
    }

    @TsRest(userContract.uploadAvatar)
    @UseInterceptors(FileInterceptor('avatar'))
    async updateUserAvatar(
        @TsRestRequest()
        {}: NestRequestShapes<typeof userContract>['uploadAvatar'],
        @UploadedFile() avatar: Express.Multer.File,
        @Body()
        body: {
            userId: string;
            x: number;
            y: number;
            width: number;
            height: number;
        },
    ) {
        body.userId = body.userId.replaceAll('"', '');
        const fileName = body.userId + '_avatar';

        async function crop(
            image: Awaited<ReturnType<typeof Jimp.fromBuffer>>,
        ) {
            // Read the image.
            image.crop({
                x: +body.x,
                y: +body.y,
                w: +body.width,
                h: +body.height,
            });
            image.resize({ w: 512, h: 512 });
            // Save and overwrite the image
        }
        const img = await Jimp.fromBuffer(avatar.buffer);
        await crop(img);

        const jpeg = await img.getBuffer('image/jpeg', { quality: 60 });

        await this.objectStorageService.uploadFile(jpeg, fileName);

        await this.userService.updateUser({
            _id: body.userId,
            avatarFileName: fileName,
        });

        this.logger.log(`Updated user avatar for ${body.userId}`);

        return {
            status: 201 as const,
            body: true,
        };
    }
}
