import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { CustomLogger } from '../logging/custom-logger';
import { loggingContract } from '../../shared/logging.contract';

@Controller()
export class LoggingController {
    constructor(private readonly logger: CustomLogger) {}

    @TsRestHandler(loggingContract.logMessage)
    async logMessage() {
        return tsRestHandler(loggingContract.logMessage, async ({ body }) => {
            switch (body.level) {
                case 'log':
                    this.logger.log(body.message, body.context);
                    break;
                case 'debug':
                    this.logger.debug(body.message, body.context);
                    break;
                case 'verbose':
                    this.logger.verbose(body.message, body.context);
                    break;
                case 'warn':
                    this.logger.warn(body.message, body.context);
                    break;
                case 'error':
                    this.logger.error(body.message, body.trace, body.context);
                    break;
            }

            return { status: 200, body: true };
        });
    }
}
