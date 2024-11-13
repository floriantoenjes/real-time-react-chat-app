import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './adapters/RedisIoAdapter';
import { ExpressPeerServer } from 'peer';
import * as express from 'express';
import * as process from 'node:process';

async function bootstrap() {
    console.log(
        `Connecting to db uri: ${process.env.uri} with username: ${process.env.user} and dbName: ${process.env.dbName}`,
    );

    console.log(
        `Connecting to S3: ${process.env.S3_URL} at ${process.env.S3_REGION} with debug flag ${process.env.S3_DEBUG}`,
    );

    const app = await NestFactory.create(AppModule);

    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();

    app.useWebSocketAdapter(redisIoAdapter);

    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type, Accept, Authorization',
    });
    await app.listen(4200);

    // peer_server
    const peerApp = express();
    const server = peerApp.listen(9000);
    const peerServer = ExpressPeerServer(server, {
        path: '/myapp',
        redisUrl: process.env.redis ?? 'redis://localhost:6379',
    });
    peerApp.use('/peerjs', peerServer);
}
bootstrap();
