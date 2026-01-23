import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RealTimeChatGateway } from './gateways/socket.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import {
    ContactGroupEntity,
    ContactGroupSchema,
} from './schemas/contact-group.schema';
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
import * as process from 'node:process';
import { LoggingController } from './controllers/logging.controller';
import { RedisPubSubFactory } from './factories/redisPubSubFactory';
import { OnlineStatusService } from './services/online-status.service';
import { WsConnectionThrottlerService } from './services/ws-connection-throttler.service';
import { PubSubFactoryToken } from './interfaces/pub-sub.factory.interface';
import { CoturnController } from './controllers/coturn.controller';
import { ContactGroupService } from './services/contact-group.service';
import { MessageService } from './services/message.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

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
            { name: ContactGroupEntity.name, schema: ContactGroupSchema },
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
                return {
                    stores: [
                        new KeyvRedis(`redis://${process.env.REDIS_HOST}:6379`),
                    ],
                    ttl: 3 * 60 * 1000,
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
        WsConnectionThrottlerService,
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
