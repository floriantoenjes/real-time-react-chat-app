import { Controller, Logger, Req, Res } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { authContract } from '../../../shared/auth.contract';
import { AuthService } from './auth.service';
import { Public } from '../../constants/auth-constants';
import { Request, Response } from 'express';
import { InvalidEmailOrPasswordException } from '../../errors/external/invalid-email-or-password.exception';
import { UserNotFoundException } from '../../errors/internal/user-not-found.exception';
import { UnauthorizedException } from '../../errors/external/unauthorized.exception';
import { returnEntityOrNotFound } from '../../controllers/utils/controller-utils';
import { AuthThrottle } from '../../decorators/throttle.decorators';

@Controller()
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) {}

    @TsRestHandler(authContract.signIn)
    @Public()
    @AuthThrottle()
    async signIn(@Res({ passthrough: true }) res: Response) {
        return tsRestHandler(authContract.signIn, async ({ body }) => {
            try {
                const signInResult = await this.authService.signIn(
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

    @TsRestHandler(authContract.signOut)
    @Public()
    async signOut(@Res({ passthrough: true }) res: Response) {
        return tsRestHandler(authContract.signOut, async () => {
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

    @TsRestHandler(authContract.refresh)
    @Public()
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        return tsRestHandler(authContract.refresh, async () => {
            try {
                const userAndFreshTokens = await this.authService.refresh(
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

                return {
                    status: 200,
                    body: {
                        authUser: userAndFreshTokens.authUser,
                        accessToken: userAndFreshTokens.accessToken,
                        refreshToken: userAndFreshTokens.refreshToken,
                    },
                };
            } catch (error: any) {
                throw new UnauthorizedException();
            }
        });
    }

    @TsRestHandler(authContract.signUp)
    @Public()
    @AuthThrottle()
    async signUp() {
        return tsRestHandler(authContract.signUp, async ({ body }) => {
            const authUser = await this.authService.createAuthUser(
                body.email,
                body.password,
                body.username,
            );

            const signInResponse = await this.authService.signIn(
                body.email,
                body.password,
            );
            const { accessToken, refreshToken } = signInResponse;

            return {
                status: 201,
                body: {
                    authUserId: authUser._id.toString(),
                    accessToken,
                    refreshToken,
                },
            };
        });
    }
}
