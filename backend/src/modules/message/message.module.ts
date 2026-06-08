import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageEntity, MessageSchema } from './message.schema';
import { UserModule } from '../user/user.module';
import { FileModule } from '../file/file.module';
import { RelationshipsModule } from '../relationships/relationships.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: MessageEntity.name, schema: MessageSchema },
        ]),
        FileModule,
        RelationshipsModule,
        UserModule,
    ],
    controllers: [MessageController],
    providers: [MessageService],
    exports: [MongooseModule],
})
export class MessageModule {}
