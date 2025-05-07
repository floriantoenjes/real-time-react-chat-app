import { Inject, Injectable } from '@nestjs/common';
import { CustomLogger } from '../logging/custom-logger';
import {
    PubClient,
    PubSubFactoryInterface,
    PubSubFactoryToken,
    SubClient,
} from '../interfaces/pub-sub.factory.interface';

enum ServerSyncEvent {
    UserOnline = 'userOnlineServerSync',
    UserOffline = 'userOfflineServerSync',
}

@Injectable()
export class OnlineStatusService {
    private readonly pubClient: PubClient;
    private readonly subClient: SubClient;

    private readonly onlineUsersSet: Set<string> = new Set<string>();

    constructor(
        private readonly logger: CustomLogger,
        @Inject(PubSubFactoryToken)
        readonly pubSubFactory: PubSubFactoryInterface,
    ) {
        const { pubClient, subClient, connectionPromise } =
            pubSubFactory.getPubAndSubClients();
        this.pubClient = pubClient;
        this.subClient = subClient;

        connectionPromise.then(() => {
            void this.subClient.subscribe(
                ServerSyncEvent.UserOnline,
                (userId) => this.setContactOnline(userId),
            );
            void this.subClient.subscribe(
                ServerSyncEvent.UserOffline,
                (userId) => this.setContactOffline(userId),
            );
        });
    }

    setContactOnline(userId: string, publishOnlineStatus = false) {
        this.logger.debug(`New contact online: ${userId}`);
        this.onlineUsersSet.add(userId);

        if (publishOnlineStatus) {
            void this.pubClient.publish(ServerSyncEvent.UserOnline, userId);
        }
    }

    setContactOffline(userId: string, publishOfflineStatus = false) {
        this.logger.debug(`New contact offline: ${userId}`);
        this.onlineUsersSet.delete(userId);

        if (publishOfflineStatus) {
            void this.pubClient.publish(ServerSyncEvent.UserOffline, userId);
        }
    }

    isUserOnline(userId: string) {
        return this.onlineUsersSet.has(userId);
    }
}
