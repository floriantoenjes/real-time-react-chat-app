import {
    BadRequestException,
    Body,
    Controller,
    Req,
    Res,
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
import { Public } from '../services/auth-constants';
import { returnEntityOrNotFound } from './utils/controller-utils';
import { Request, Response } from 'express';

@Controller()
export class UserController {
    constructor(private readonly userService: UserService) {}

    @TsRestHandler(userContract.getAll)
    async getAll() {
        return tsRestHandler(userContract.getAll, async () => {
            return returnEntityOrNotFound(await this.userService.findUsersBy());
        });
    }

    @TsRestHandler(userContract.signIn)
    @Public()
    async signIn(@Res({ passthrough: true }) res: Response) {
        return tsRestHandler(userContract.signIn, async ({ body }) => {
            const signInResult = await this.userService.signIn(
                body.email,
                body.password,
            );

            const secureCookieOptions = {
                secure: true,
                httpOnly: true,
                sameSite: 'lax' as const,
                maxAge: 3_600_000,
            };

            res.cookie(
                'accessToken',
                signInResult?.accessToken,
                secureCookieOptions,
            );

            res.cookie('refreshToken', signInResult?.refreshToken, {
                ...secureCookieOptions,
                path: '/refresh',
            });

            return returnEntityOrNotFound(signInResult);
        });
    }

    @TsRestHandler(userContract.signOut)
    async signOut(@Res({ passthrough: true }) res: Response) {
        return tsRestHandler(userContract.signOut, async () => {
            const secureCookieOptions = {
                secure: true,
                httpOnly: true,
                sameSite: 'lax' as const,
                maxAge: 0,
            };

            res.cookie('accessToken', '', secureCookieOptions);

            res.cookie('refreshToken', '', {
                ...secureCookieOptions,
                path: '/refresh',
            });

            return { status: 204, body: {} };
        });
    }

    @TsRestHandler(userContract.refresh)
    @Public()
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        return tsRestHandler(userContract.refresh, async () => {
            const userAndFreshTokens = await this.userService.refresh(
                req.cookies.accessToken,
                req.cookies.refreshToken,
            );
            if (!userAndFreshTokens) {
                return { status: 401, body: 'Unauthorized' };
            }

            const secureCookieOptions = {
                secure: true,
                httpOnly: true,
                sameSite: 'lax' as const,
                maxAge: 3_600_000,
            };

            res.cookie(
                'accessToken',
                userAndFreshTokens?.accessToken,
                secureCookieOptions,
            );

            res.cookie('refreshToken', userAndFreshTokens?.refreshToken, {
                ...secureCookieOptions,
                path: '/refresh',
            });

            return { status: 200, body: { user: userAndFreshTokens.user } };
        });
    }

    @TsRestHandler(userContract.signUp)
    @Public()
    async signUp() {
        return tsRestHandler(userContract.signUp, async ({ body }) => {
            const newUser = await this.userService
                .createUser(body.email, body.password, body.username)
                .catch(() => {
                    throw new BadRequestException(
                        { message: 'Already exists' },
                        `New user with username ${body.username} could not be created`,
                    );
                });

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
            return this.userService.loadAvatar(params.userId);
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
        const userId = body.userId.replaceAll('"', '');
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
    }
}
