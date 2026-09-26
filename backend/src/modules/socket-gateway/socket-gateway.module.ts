import { Module } from '@nestjs/common';
import { RealTimeChatGateway } from './socket.gateway';
import { OnlineStatusModule } from '../online-status/online-status.module';
import { WsConnectionThrottlerService } from './ws-connection-throttler.service';
import { RelationshipsModule } from '../relationships/relationships.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [RelationshipsModule, OnlineStatusModule, UserModule],
    providers: [RealTimeChatGateway, WsConnectionThrottlerService],
})
export class SocketGatewayModule {}
