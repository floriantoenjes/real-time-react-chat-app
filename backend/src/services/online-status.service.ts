import { Inject, Injectable } from '@nestjs/common';
import { CustomLogger } from '../logging/custom-logger';
import {
    PubClient,
    PubSubFactoryInterface,
    PubSubFactoryToken,
    SubClient,
} from '../interfaces/pub-sub.factory.interface';

@Injectable()
export class OnlineStatusService {
    private readonly pubClient: PubClient<unknown>;
    private readonly subClient: SubClient;

    private readonly onlineUsersSet: Set<string> = new Set<string>();

    constructor(
        private readonly logger: CustomLogger,
        @Inject(PubSubFactoryToken)
        readonly pubSubFactory: PubSubFactoryInterface<unknown>,
    ) {
        const { pubClient, subClient, connectionPromise } =
            pubSubFactory.getPubAndSubClients();
        this.pubClient = pubClient;
        this.subClient = subClient;

        connectionPromise.then(() => {
            void this.subClient.subscribe('userOnlineServerSync', (userId) =>
                this.setContactOnline(userId),
            );
            void this.subClient.subscribe('userOfflineServerSync', (userId) =>
                this.setContactOffline(userId),
            );
        });
    }

    setContactOnline(userId: string, publishOnlineStatus = false) {
        this.logger.debug(`New contact online: ${userId}`);
        this.onlineUsersSet.add(userId);

        if (publishOnlineStatus) {
            void this.pubClient.publish('userOnlineServerSync', userId);
        }
    }

    setContactOffline(userId: string, publishOfflineStatus = false) {
        this.logger.debug(`New contact offline: ${userId}`);
        this.onlineUsersSet.delete(userId);

        if (publishOfflineStatus) {
            void this.pubClient.publish('userOfflineServerSync', userId);
        }
    }

    isUserOnline(userId: string) {
        return this.onlineUsersSet.has(userId);
    }
}
