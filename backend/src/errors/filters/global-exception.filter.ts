import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { OperationFailedException } from '../external/operation-failed.exception';
import { CustomLogger } from '../../logging/custom-logger';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: CustomLogger) {
        logger.setContext(GlobalExceptionFilter.name);
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        if (exception instanceof ClientFriendlyHttpException) {
            const status = exception.getStatus();
            response.status(status).json(exception.getResponse());
            return;
        }

        if (exception instanceof Error) {
            this.logger.error(exception.message, exception.stack);
        } else {
            this.logger.error(JSON.stringify(exception));
        }

        response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json(new OperationFailedException().getResponse());
    }
}
