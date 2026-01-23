import {
    Controller,
    Logger,
    Req,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { userContract } from '../../shared/user.contract';
import { UserService } from '../services/user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../constants/auth-constants';
import { returnEntityOrNotFound } from './utils/controller-utils';
import { Request, Response } from 'express';
import { InvalidEmailOrPasswordException } from '../errors/external/invalid-email-or-password.exception';
import { UserNotFoundException } from '../errors/internal/user-not-found.exception';
import { UnauthorizedException } from '../errors/external/unauthorized.exception';
import { UserId } from '../decorators/user-id.decorator';
import { AuthThrottle } from '../decorators/throttle.decorators';

@Controller()
export class UserController {
    private readonly logger = new Logger(UserController.name);

    constructor(private readonly userService: UserService) {}

    @TsRestHandler(userContract.getAll)
    async getAll() {
        return tsRestHandler(userContract.getAll, async () => {
            return returnEntityOrNotFound(await this.userService.findUsersBy());
        });
    }

    @TsRestHandler(userContract.signIn)
    @Public()
    @AuthThrottle()
    async signIn(@Res({ passthrough: true }) res: Response) {
        return tsRestHandler(userContract.signIn, async ({ body }) => {
            try {
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
            } catch (error: any) {
                if (error instanceof UserNotFoundException) {
                    throw new InvalidEmailOrPasswordException();
                }
                throw error;
            }
        });
    }

    @TsRestHandler(userContract.signOut)
    @Public()
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

            return { status: 204, body: undefined };
        });
    }

    @TsRestHandler(userContract.refresh)
    @Public()
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        return tsRestHandler(userContract.refresh, async () => {
            try {
                const userAndFreshTokens = await this.userService.refresh(
                    req.cookies.accessToken,
                    req.cookies.refreshToken,
                );

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
            } catch (error: any) {
                throw new UnauthorizedException();
            }
        });
    }

    @TsRestHandler(userContract.signUp)
    @Public()
    @AuthThrottle()
    async signUp() {
        return tsRestHandler(userContract.signUp, async ({ body }) => {
            const newUser = await this.userService.createUser(
                body.email,
                body.password,
                body.username,
            );

            const signInResponse = await this.userService.signIn(
                body.email,
                body.password,
            );
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
