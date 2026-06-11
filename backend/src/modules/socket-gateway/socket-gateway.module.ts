import { Module } from '@nestjs/common';
import { RealTimeChatGateway } from './socket.gateway';
import { OnlineStatusModule } from '../online-status/online-status.module';
import { WsConnectionThrottlerService } from './ws-connection-throttler.service';
import { RelationshipsModule } from '../relationships/relationships.module';

@Module({
    imports: [RelationshipsModule, OnlineStatusModule],
    providers: [RealTimeChatGateway, WsConnectionThrottlerService],
})
export class SocketGatewayModule {}
