import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserSchema } from './user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: UserEntity.name, schema: UserSchema },
        ]),
    ],
    controllers: [UserController],
    providers: [UserService],
    exports: [MongooseModule, UserService],
})
export class UserModule {}
