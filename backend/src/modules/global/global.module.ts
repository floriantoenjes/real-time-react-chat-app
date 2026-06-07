import { Global, Module } from '@nestjs/common';
import { ObjectStorageService } from '../../services/object-storage.service';
import { EventBusService } from '../../services/event-bus.service';

@Global()
@Module({
    providers: [EventBusService, ObjectStorageService],
    exports: [EventBusService, ObjectStorageService],
})
export class GlobalModule {}
