import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RealTimeChatGateway } from './socket.gateway';
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

@Module({
  imports: [
    ServeStaticModule.forRoot({
      serveRoot: '/frontend',
      rootPath: join(__dirname, '..', '..', '..', 'frontend/dist'),
    }),
    MongooseModule.forRoot('mongodb://localhost'),
    MongooseModule.forFeature([
      { name: MessageEntity.name, schema: MessageSchema },
      // { name: Contact.name, schema: ContactSchema },
      // { name: ContactGroup.name, schema: ContactGroupSchema },
      { name: UserEntity.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    AppController,
    ContactController,
    MessageController,
    UserController,
    ContactGroupController,
  ],
  providers: [AppService, RealTimeChatGateway, UserService],
})
export class AppModule {}
