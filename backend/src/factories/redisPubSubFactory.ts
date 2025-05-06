import { createClient } from 'redis';
import {
    PubClient,
    PubSubFactoryInterface,
    SubClient,
} from '../interfaces/pub-sub.factory.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisPubSubFactory implements PubSubFactoryInterface<number> {
    getPubAndSubClients(): {
        pubClient: PubClient<number>;
        subClient: SubClient;
        connectionPromise: Promise<unknown>;
    } {
        const pubClient = createClient({
            url: process.env.redis ?? `redis://localhost:6379`,
        });
        const subClient = pubClient.duplicate();

        return {
            pubClient,
            subClient,
            connectionPromise: Promise.all([
                pubClient.connect(),
                subClient.connect(),
            ]),
        };
    }
}
