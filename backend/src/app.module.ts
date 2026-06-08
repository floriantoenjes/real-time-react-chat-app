import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './modules/auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './guards/custom-throttler.guard';
import * as process from 'node:process';
import { LoggingController } from './controllers/logging.controller';
import { RedisPubSubFactory } from './factories/redisPubSubFactory';
import { PubSubFactoryToken } from './interfaces/pub-sub.factory.interface';
import { CoturnController } from './controllers/coturn.controller';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { GlobalModule } from './modules/global/global.module';
import { MessageModule } from './modules/message/message.module';
import { ContactModule } from './modules/contact/contact.module';
import { IgnoredUserModule } from './modules/ignored-user/ignored-user.module';
import { UserModule } from './modules/user/user.module';
import { ContactGroupModule } from './modules/contact-group/contact-group.module';
import { FileModule } from './modules/file/file.module';
import { InitModule } from './modules/init/init.module';
import { SocketGatewayModule } from './modules/socket-gateway/socket-gateway.module';

@Module({
    imports: [
        SentryModule.forRoot(),
        ConfigModule.forRoot({ isGlobal: true }),
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
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService) => ({
                global: true,
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: '600s',
                },
            }),
            global: true,
            inject: [ConfigService],
            imports: [ConfigModule.forRoot()],
        }),
        CacheModule.registerAsync({
            isGlobal: true,
            useFactory: async () => {
                return {
                    stores: [
                        new KeyvRedis(`redis://${process.env.REDIS_HOST}:6379`),
                    ],
                    ttl: 3 * 60 * 1000,
                };
            },
        }),
        EventEmitterModule.forRoot(),

        // Self defined modules
        AuthModule,
        ContactGroupModule,
        ContactModule,
        FileModule,
        GlobalModule,
        IgnoredUserModule,
        InitModule,
        MessageModule,
        SocketGatewayModule,
        UserModule,
    ],
    controllers: [AppController, CoturnController, LoggingController],
    providers: [
        AppService,
        { provide: PubSubFactoryToken, useClass: RedisPubSubFactory },
        {
            provide: APP_GUARD,
            useClass: CustomThrottlerGuard,
        },
    ],
})
export class AppModule {}
