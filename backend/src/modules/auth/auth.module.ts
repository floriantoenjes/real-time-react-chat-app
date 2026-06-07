import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthUserEntity, AuthUserSchema } from './auth.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AuthUserEntity.name, schema: AuthUserSchema },
        ]),
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule {}
