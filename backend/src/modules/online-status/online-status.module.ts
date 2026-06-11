import { Module } from '@nestjs/common';
import { OnlineStatusService } from './online-status.service';
import { RedisPubSubFactory } from '../../factories/redisPubSubFactory';
import { PubSubFactoryToken } from '../../interfaces/pub-sub.factory.interface';
import { OnlineStatusController } from './online-status.controller';

@Module({
    controllers: [OnlineStatusController],
    providers: [
        OnlineStatusService,
        { provide: PubSubFactoryToken, useClass: RedisPubSubFactory },
    ],
    exports: [OnlineStatusService],
})
export class OnlineStatusModule {}
