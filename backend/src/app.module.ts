import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RealTimeChatGateway } from './gateways/socket.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageEntity, MessageSchema } from './schemas/message.schema';
import { UserEntity, UserSchema } from './schemas/user.schema';
import { ContactController } from './controllers/contact.controller';
import { MessageController } from './controllers/message.controller';
import { UserController } from './controllers/user.controller';
import { ContactGroupController } from './controllers/contact-group.controller';
import { UserService } from './services/user.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ObjectStorageService } from './services/object-storage.service';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { CustomThrottlerGuard } from './guards/custom-throttler.guard';
import { FileController } from './controllers/file.controller';
import { ContactService } from './services/contact.service';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import * as process from 'node:process';
import { LoggingController } from './controllers/logging.controller';
import { RedisPubSubFactory } from './factories/redisPubSubFactory';
import { OnlineStatusService } from './services/online-status.service';
import { PubSubFactoryToken } from './interfaces/pub-sub.factory.interface';
import { CoturnController } from './controllers/coturn.controller';
import { ContactGroupService } from './services/contact-group.service';
import { MessageService } from './services/message.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';

@Module({
    imports: [
        SentryModule.forRoot(),
        ConfigModule.forRoot(),
        ThrottlerModule.forRoot({
            throttlers: [{ limit: 100, ttl: 60 * 1000 }],
        }),
        ServeStaticModule.forRoot({
            serveRoot: '/frontend',
            rootPath: join(__dirname, '..', '..', '..', 'frontend/dist'),
        }),
        MongooseModule.forRoot(process.env.uri ?? '', {
            user: process.env.user,
            pass: process.env.pass,
            dbName: 'real-time-chat',
        }),
        MongooseModule.forFeature([
            { name: MessageEntity.name, schema: MessageSchema },
            { name: UserEntity.name, schema: UserSchema },
        ]),
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService) => ({
                global: true,
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: '600s',
                },
            }),
            inject: [ConfigService],
            imports: [ConfigModule.forRoot()],
        }),
        CacheModule.registerAsync({
            useFactory: async () => {
                const store = await redisStore({
                    socket: {
                        host: process.env.REDIS_HOST,
                        port: 6379,
                    },
                });

                return {
                    store: store as unknown as CacheStore,
                    ttl: 3 * 60000, // 3 minutes (milliseconds)
                };
            },
        }),
    ],
    controllers: [
        AppController,
        ContactController,
        ContactGroupController,
        CoturnController,
        FileController,
        LoggingController,
        MessageController,
        UserController,
    ],
    providers: [
        AppService,
        ContactService,
        ContactGroupService,
        MessageService,
        ObjectStorageService,
        OnlineStatusService,
        RealTimeChatGateway,
        UserService,
        { provide: PubSubFactoryToken, useClass: RedisPubSubFactory },
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: CustomThrottlerGuard,
        },
    ],
})
export class AppModule {}
