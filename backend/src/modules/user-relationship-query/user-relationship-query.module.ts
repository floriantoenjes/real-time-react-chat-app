import { Module } from '@nestjs/common';
import { UserRelationshipQueryService } from './user-relationship-query.service';
import { IgnoredUserModule } from '../ignored-user/ignored-user.module';

@Module({
    imports: [IgnoredUserModule],
    providers: [UserRelationshipQueryService],
    exports: [UserRelationshipQueryService],
})
export class UserRelationshipQueryModule {}
