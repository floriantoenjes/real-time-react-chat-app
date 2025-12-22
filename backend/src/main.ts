import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './adapters/RedisIoAdapter';
import { ExpressPeerServer } from 'peer';
import * as express from 'express';
import * as process from 'node:process';
import * as cookieParser from 'cookie-parser';
import { CustomLogger } from './logging/custom-logger';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './errors/filters/global-exception.filter';

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
    app.use(cookieParser());

    const customLogger = new CustomLogger(app.get(ConfigService));
    app.useLogger(customLogger);

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
