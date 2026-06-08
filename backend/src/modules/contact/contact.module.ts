import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { UserRelationshipQueryModule } from '../user-relationship-query/user-relationship-query.module';
import { OnlineStatusModule } from '../online-status/online-status.module';
import { UserModule } from '../user/user.module';
import { ContactRequestModule } from '../contact-request/contact-request.module';

@Module({
    imports: [
        ContactRequestModule,
        OnlineStatusModule,
        UserModule,
        UserRelationshipQueryModule,
    ],
    controllers: [ContactController],
    providers: [ContactService],
    exports: [ContactService],
})
export class ContactModule {}
