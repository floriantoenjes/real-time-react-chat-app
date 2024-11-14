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
import { ConfigModule } from '@nestjs/config';
import { ObjectStorageService } from './services/object-storage.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './services/constants';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { FileController } from './controllers/file.controller';
import { ContactService } from './services/contact.service';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import * as process from 'node:process';

@Module({
    imports: [
        ConfigModule.forRoot(),
        ServeStaticModule.forRoot({
            serveRoot: '/frontend',
            rootPath: join(__dirname, '..', '..', '..', 'frontend/dist'),
        }),
        MongooseModule.forRoot(process.env.uri ?? 'mongodb://localhost', {
            user: process.env.user,
            pass: process.env.pass,
            dbName: 'real-time-chat',
        }),
        MongooseModule.forFeature([
            { name: MessageEntity.name, schema: MessageSchema },
            // { name: ContactEntity.name, schema: ContactSchema },
            // { name: ContactGroup.name, schema: ContactGroupSchema },
            { name: UserEntity.name, schema: UserSchema },
        ]),
        JwtModule.register({
            global: true,
            secret: jwtConstants.secret,
            signOptions: {
                expiresIn: '600s',
            },
        }),
        CacheModule.registerAsync({
            useFactory: async () => {
                const store = await redisStore({
                    socket: {
                        host: process.env.REDIS_HOST ?? 'localhost',
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
        FileController,
        MessageController,
        UserController,
        ContactGroupController,
    ],
    providers: [
        AppService,
        ContactService,
        RealTimeChatGateway,
        UserService,
        ObjectStorageService,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
})
export class AppModule {}
