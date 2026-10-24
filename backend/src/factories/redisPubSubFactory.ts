import { createClient } from 'redis';
import {
    PubClient,
    PubSubFactoryInterface,
    SubClient,
} from '../interfaces/pub-sub.factory.interface';
import { Injectable } from '@nestjs/common';
import { getRedisUrl } from '../config/redis.config';

@Injectable()
export class RedisPubSubFactory implements PubSubFactoryInterface {
    getPubAndSubClients(): {
        pubClient: PubClient;
        subClient: SubClient;
        connectionPromise: Promise<unknown>;
    } {
        const pubClient = createClient({
            url: getRedisUrl(),
        });
        const subClient = pubClient.duplicate();

        return {
            pubClient,
            subClient,
            connectionPromise: Promise.all([
                pubClient.connect(),
                subClient.connect(),
            ]).then(() => console.log('Redis pub sub connected!')),
        };
    }
}
