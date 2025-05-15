import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as WinstonGelfTransport from 'winston-gelf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomLogger implements LoggerService {
    private logger: winston.Logger;

    constructor(private readonly configService: ConfigService) {
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

    log(message: string, context?: string) {
        this.logger.info({ message, context });
    }

    error(message: string, trace?: string, context?: string) {
        this.logger.error({ message, trace, context });
    }

    warn(message: string, context?: string) {
        this.logger.warn({ message, context });
    }

    debug(message: string, context?: string) {
        this.logger.debug({ message, context });
    }

    verbose(message: string, context?: string) {
        this.logger.verbose({ message, context });
    }
}
