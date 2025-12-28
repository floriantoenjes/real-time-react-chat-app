import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger implements LoggerService {
    private logger: winston.Logger;

    private context?: string;

    constructor(readonly configService: ConfigService) {
        this.logger = winston.createLogger({
            transports: [
                new WinstonGelfTransport({
                    gelfPro: {
                        fields: { app_name: 'nestjs-app' },
                        adapterName: 'udp',
                        adapterOptions: {
                            host: configService.get('LOG_HOST'), // Graylog host
                            port: configService.get('LOG_PORT'), // GELF input port configured in Graylog
                        },
                    },
                }),
            ],
        });
    }

    setContext(context: string) {
        this.context = context;
    }

    log(message: string) {
        this.logger.info({ message, context: this.context });
    }

    error(message: string, trace?: string) {
        this.logger.error({ message, trace, context: this.context });
    }

    warn(message: string) {
        this.logger.warn({ message, context: this.context });
    }

    debug(message: string) {
        this.logger.debug({ message, context: this.context });
    }

    verbose(message: string) {
        this.logger.verbose({ message, context: this.context });
    }
}
