// Import this first!
import './instrument';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './adapters/RedisIoAdapter';
import { ExpressPeerServer } from 'peer';
import * as express from 'express';
import * as process from 'node:process';
import * as cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from './errors/filters/global-exception.filter';

function maskValue(value: string | undefined, visibleChars = 4): string {
    if (!value) return '[not set]';
    if (value.length <= visibleChars) return '***';
    return '***' + value.slice(-visibleChars);
}

function maskUri(uri: string | undefined): string {
    if (!uri) return '[not set]';
    try {
        const url = new URL(uri);
        return `${url.protocol}//${url.host}${url.pathname}`;
    } catch {
        return maskValue(uri);
    }
}

async function bootstrap() {
    console.log(`Connecting to db: ${maskUri(process.env.uri)}`);

    console.log(
        `Connecting to S3: ${maskUri(process.env.S3_URL)} at ${process.env.S3_REGION}`,
    );

    const app = await NestFactory.create(AppModule);

    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();

    app.useWebSocketAdapter(redisIoAdapter);
    app.use(cookieParser());

    app.useGlobalFilters(new GlobalExceptionFilter());

    app.enableCors({
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type, Accept, Authorization',
        credentials: true,
    });
    await app.listen(4200);

    // peer_server
    const peerApp = express();
    const server = peerApp.listen(9000);
    const peerServer = ExpressPeerServer(server, {
        path: '/myapp',
        redisUrl: process.env.redis,
    });
    peerApp.use('/peerjs', peerServer);
}
void bootstrap();
