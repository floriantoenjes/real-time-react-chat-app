import { Module } from '@nestjs/common';
import { InitService } from './init.service';
import { AuthModule } from '../auth/auth.module';
import { FileModule } from '../file/file.module';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';
import { RelationshipsModule } from '../relationships/relationships.module';

@Module({
    imports: [
        AuthModule,
        FileModule,
        MessageModule,
        RelationshipsModule,
        UserModule,
    ],
    providers: [InitService],
})
export class InitModule {}
