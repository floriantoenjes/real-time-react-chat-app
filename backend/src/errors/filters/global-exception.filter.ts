import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppHttpException } from '../app-http.exception';
import { OperationFailedException } from '../external/operation-failed.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        // If the exception is already client-friendly, use it
        if (exception instanceof AppHttpException) {
            const status = exception.getStatus();
            response.status(status).json(exception.getResponse());
            return;
        }

        // For all other exceptions, return a generic message
        response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json(new OperationFailedException().getResponse());
    }
}
