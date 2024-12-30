import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as WinstonGelfTransport from 'winston-gelf';

@Injectable()
export class CustomLogger implements LoggerService {
    private logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
            transports: [
                new WinstonGelfTransport({
                    gelfPro: {
                        fields: { app_name: 'nestjs-app' },
                        adapterName: 'udp',
                        adapterOptions: {
                            host: 'localhost', // Graylog host
                            port: 12201, // GELF input port configured in Graylog
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
