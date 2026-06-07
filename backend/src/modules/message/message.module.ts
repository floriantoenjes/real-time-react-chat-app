import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageEntity, MessageSchema } from './message.schema';
import { UserRelationshipQueryModule } from '../user-relationship-query/user-relationship-query.module';
import { UserModule } from '../user/user.module';
import { FileModule } from '../file/file.module';
import { ContactGroupModule } from '../contact-group/contact-group.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: MessageEntity.name, schema: MessageSchema },
        ]),
        ContactGroupModule,
        FileModule,
        UserModule,
        UserRelationshipQueryModule,
    ],
    controllers: [MessageController],
    providers: [MessageService],
    exports: [MongooseModule],
})
export class MessageModule {}
