import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisPubSubFactory } from '../factories/redisPubSubFactory';

export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor?: ReturnType<typeof createAdapter>;

    async connectToRedis(): Promise<void> {
        const { pubClient, subClient, connectionPromise } =
            new RedisPubSubFactory().getPubAndSubClients();

        await connectionPromise;

        this.adapterConstructor = createAdapter(pubClient, subClient);

        console.log('Connected to Redis and adapter initialized');
    }

    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);

        console.log('Socket.IO server created with Redis adapter');

        return server;
    }
}
