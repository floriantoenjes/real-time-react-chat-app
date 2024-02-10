import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RealTimeChatGateway } from './socket.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/message.schema';
import { Contact, ContactSchema } from './schemas/contact.schema';
import { User, UserSchema } from './schemas/user.schema';
import { ContactController } from './controllers/contact.controller';
import { MessageController } from './controllers/message.controller';
import { UserController } from './controllers/user.controller';
import {
  ContactGroup,
  ContactGroupSchema,
} from './schemas/contact-group.schema';
import { ContactGroupController } from './controllers/contact-group.controller';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost'),
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: ContactGroup.name, schema: ContactGroupSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    AppController,
    ContactController,
    MessageController,
    UserController,
    ContactGroupController,
  ],
  providers: [AppService, RealTimeChatGateway],
})
export class AppModule {}
