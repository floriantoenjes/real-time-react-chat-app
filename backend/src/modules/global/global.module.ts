import { Global, Module } from '@nestjs/common';
import { ObjectStorageService } from './object-storage.service';
import { EventBusService } from './event-bus.service';

@Global()
@Module({
    providers: [EventBusService, ObjectStorageService],
    exports: [EventBusService, ObjectStorageService],
})
export class GlobalModule {}
