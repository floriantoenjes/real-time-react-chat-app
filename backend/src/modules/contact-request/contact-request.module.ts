import { ContactRequestService } from './contact-request.service';
import { ContactRequestController } from './contact-request.controller';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
    ContactRequestEntity,
    ContactRequestSchema,
} from './contact-request.schema';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ContactRequestEntity.name, schema: ContactRequestSchema },
        ]),
        UserModule,
    ],
    controllers: [ContactRequestController],
    providers: [ContactRequestService],
    exports: [ContactRequestService, MongooseModule],
})
export class ContactRequestModule {}
