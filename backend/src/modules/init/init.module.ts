import { Module } from '@nestjs/common';
import { InitService } from './init.service';
import { AuthModule } from '../auth/auth.module';
import { ContactGroupModule } from '../contact-group/contact-group.module';
import { ContactRequestModule } from '../contact-request/contact-request.module';
import { FileModule } from '../file/file.module';
import { IgnoredUserModule } from '../ignored-user/ignored-user.module';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';

@Module({
    imports: [
        AuthModule,
        ContactGroupModule,
        ContactRequestModule,
        FileModule,
        IgnoredUserModule,
        MessageModule,
        UserModule,
    ],
    providers: [InitService],
})
export class InitModule {}
