import { Module } from '@nestjs/common';
import { ContactController } from './contact/contact.controller';
import { ContactGroupController } from './contact-group/contact-group.controller';
import { ContactRequestController } from './contact-request/contact-request.controller';
import { IgnoredUserController } from './ignored-user/ignored-user.controller';
import { ContactService } from './contact/contact.service';
import { ContactGroupService } from './contact-group/contact-group.service';
import { IgnoredUserService } from './ignored-user/ignored-user.service';
import { UserRelationshipQueryService } from './user-relationship-query/user-relationship-query.service';
import { ContactRequestService } from './contact-request/contact-request.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
    ContactGroupEntity,
    ContactGroupSchema,
} from './contact-group/contact-group.schema';
import {
    ContactRequestEntity,
    ContactRequestSchema,
} from './contact-request/contact-request.schema';
import { OnlineStatusModule } from '../online-status/online-status.module';
import { UserModule } from '../user/user.module';
import {
    IgnoredUserEntity,
    IgnoredUserSchema,
} from './ignored-user/ignored-user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ContactGroupEntity.name, schema: ContactGroupSchema },
            { name: ContactRequestEntity.name, schema: ContactRequestSchema },
            { name: IgnoredUserEntity.name, schema: IgnoredUserSchema },
        ]),

        OnlineStatusModule,
        UserModule,
    ],
    controllers: [
        ContactController,
        ContactGroupController,
        ContactRequestController,
        IgnoredUserController,
    ],
    providers: [
        ContactService,
        ContactGroupService,
        ContactRequestService,
        IgnoredUserService,
        UserRelationshipQueryService,
    ],
    exports: [ContactService, MongooseModule, UserRelationshipQueryService],
})
export class RelationshipsModule {}
