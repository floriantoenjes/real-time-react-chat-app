import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserNotFoundException } from '../../errors/internal/user-not-found.exception';
import { UnauthorizedException } from '../../errors/external/unauthorized.exception';
import { AuthUserEntity } from './auth.schema';
import { AuthUser } from '../../../shared/auth.contract';
import { EmailAlreadyTakenException } from '../../errors/external/email-already-taken.exception';
import { UserCreatedEvent } from '../../events/user.events';
import { EventNames } from '../../events/event-names.enum';
import { EventBusService } from '../global/event-bus.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly SALT_OR_ROUNDS = 10;

    constructor(
        @InjectModel(AuthUserEntity.name)
        private readonly authUserModel: Model<AuthUserEntity>,
        private readonly eventBus: EventBusService,
        private readonly jwtService: JwtService,
    ) {}

    async verifyCredentials(
        email: string,
        password: string,
    ): Promise<AuthUser | null> {
        const authUser = await this.authUserModel
            .findOne({ email })
            .select('+password');

        if (!authUser) {
            this.logger.debug(`User with email ${email} not found`);
            return null;
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            authUser.password,
        );
        if (!isPasswordValid) {
            this.logger.debug(`Invalid password for email ${email}`);
            return null;
        }

        authUser.password = '';
        return authUser;
    }

    async signIn(email: string, password: string) {
        const authUser = await this.verifyCredentials(email, password);
        if (!authUser) {
            this.logger.log(`Authentication failed for email ${email}`);
            throw new UserNotFoundException();
        }

        const payload = { sub: authUser._id.toString(), email };
        this.logger.log(`Signed in with id ${authUser._id}`);

        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: '7d',
        });

        await this.authUserModel.updateOne(
            { email },
            {
                $set: {
                    refreshTokenEncrypted: await bcrypt.hash(
                        refreshToken,
                        this.SALT_OR_ROUNDS,
                    ),
                },
            },
        );

        return {
            authUser,
            accessToken: await this.jwtService.signAsync(payload),
            refreshToken: refreshToken,
        };
    }

    async refresh(
        accessToken: string,
        refreshToken?: string,
    ): Promise<{
        authUser: AuthUser;
        accessToken: string;
        refreshToken: string;
    }> {
        try {
            this.jwtService.verify(accessToken);

            const decodedJwt = this.jwtService.decode(accessToken);

            const authUser = await this.findAuthUserByEmail(decodedJwt?.email);
            if (!authUser) {
                this.logger.warn(
                    `Refresh failed: user not found for username ${decodedJwt?.username}`,
                );
                throw new UserNotFoundException();
            }

            return await this.respondWithNewTokens(authUser);
        } catch (error: any) {
            if (!refreshToken) {
                this.logger.warn(
                    `Refresh failed: no refresh token provided and access token invalid`,
                );
                throw new UnauthorizedException(error);
            }

            try {
                this.jwtService.verify(refreshToken);
            } catch (verifyError: any) {
                this.logger.warn(
                    `Refresh failed: invalid refresh token - ${verifyError.message}`,
                );
                throw new UnauthorizedException(verifyError);
            }

            const decodedJwt = this.jwtService.decode(refreshToken);

            const authUser = await this.findAuthUserByEmail(decodedJwt?.email);
            const refreshTokenFromDb = authUser?.refreshTokenEncrypted;

            if (!authUser) {
                this.logger.warn(
                    `Refresh failed: user not found for username ${decodedJwt?.username}`,
                );
                throw new UserNotFoundException();
            }

            if (
                !refreshTokenFromDb ||
                !(await bcrypt.compare(refreshToken, refreshTokenFromDb))
            ) {
                this.logger.warn(
                    `Refresh failed: refresh token mismatch for user ${authUser._id}`,
                );
                throw new UnauthorizedException();
            }

            return await this.respondWithNewTokens(authUser);
        }
    }

    private async respondWithNewTokens(authUser: AuthUser) {
        const payload = { sub: authUser._id, email: authUser.email };
        this.logger.debug(`Refreshed access token for user ${authUser._id}`);

        const refreshTokenNew = await this.jwtService.signAsync(payload, {
            expiresIn: '7d',
        });
        await this.authUserModel.updateOne(
            { _id: authUser._id },
            {
                $set: {
                    refreshTokenEncrypted: await bcrypt.hash(
                        refreshTokenNew,
                        this.SALT_OR_ROUNDS,
                    ),
                },
            },
        );

        return {
            authUser,
            accessToken: await this.jwtService.signAsync(payload),
            refreshToken: refreshTokenNew,
        };
    }

    private async findAuthUserByEmail(email: string): Promise<AuthUser | null> {
        const authUser = await this.authUserModel.findOne({ email });
        if (authUser) {
            authUser.password = '';
        }
        return authUser;
    }

    async createAuthUser(email: string, password: string, username: string) {
        try {
            const hash = await bcrypt.hash(password, this.SALT_OR_ROUNDS);

            const createdAuthUser = await this.authUserModel.create({
                email,
                password: hash,
            });

            this.eventBus.emit<UserCreatedEvent>(EventNames.USER_CREATED, {
                authUserId: createdAuthUser._id,
                username: username,
            });

            this.logger.log(`Created auth user "${createdAuthUser._id}"`);

            // await this.cache.del(findUsersByCacheKey());

            createdAuthUser.password = '';

            return createdAuthUser;
        } catch (error: any) {
            this.logger.warn(
                `User creation failed for email ${email}: ${error.message}`,
            );
            throw new EmailAlreadyTakenException(error);
        }
    }
}
