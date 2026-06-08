import { Module } from '@nestjs/common';
import { IgnoredUserService } from './ignored-user.service';
import { IgnoredUserController } from './ignored-user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { IgnoredUserEntity, IgnoredUserSchema } from './ignored-user.schema';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: IgnoredUserEntity.name, schema: IgnoredUserSchema },
        ]),
        UserModule,
    ],
    controllers: [IgnoredUserController],
    providers: [IgnoredUserService],
    exports: [MongooseModule],
})
export class IgnoredUserModule {}
