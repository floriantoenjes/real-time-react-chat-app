import { Module } from '@nestjs/common';
import { RealTimeChatGateway } from '../../gateways/socket.gateway';
import { ContactModule } from '../contact/contact.module';
import { OnlineStatusModule } from '../online-status/online-status.module';
import { WsConnectionThrottlerService } from '../../services/ws-connection-throttler.service';

@Module({
    imports: [ContactModule, OnlineStatusModule],
    providers: [RealTimeChatGateway, WsConnectionThrottlerService],
})
export class SocketGatewayModule {}
