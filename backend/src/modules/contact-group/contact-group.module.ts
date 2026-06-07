import { Module } from '@nestjs/common';
import { ContactGroupService } from './contact-group.service';
import { ContactGroupController } from './contact-group.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactGroupEntity, ContactGroupSchema } from './contact-group.schema';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: ContactGroupEntity.name,
                schema: ContactGroupSchema,
            },
        ]),
        UserModule,
    ],
    controllers: [ContactGroupController],
    providers: [ContactGroupService],
    exports: [MongooseModule],
})
export class ContactGroupModule {}
