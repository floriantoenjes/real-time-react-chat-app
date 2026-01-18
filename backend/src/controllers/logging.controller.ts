import { Controller, Logger } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { loggingContract } from '../../shared/logging.contract';

@Controller()
export class LoggingController {
    private readonly logger = new Logger(LoggingController.name);

    @TsRestHandler(loggingContract.logMessage)
    async logMessage() {
        return tsRestHandler(loggingContract.logMessage, async ({ body }) => {
            switch (body.level) {
                case 'log':
                    this.logger.log(body.message);
                    break;
                case 'debug':
                    this.logger.debug(body.message);
                    break;
                case 'verbose':
                    this.logger.verbose(body.message);
                    break;
                case 'warn':
                    this.logger.warn(body.message);
                    break;
                case 'error':
                    this.logger.error(body.message, body.trace);
                    break;
            }

            return { status: 200, body: true };
        });
    }
}
