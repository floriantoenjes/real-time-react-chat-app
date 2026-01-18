import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { OperationFailedException } from '../external/operation-failed.exception';
import { RateLimitExceededException } from '../external/rate-limit-exceeded.exception';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';
import { AppHttpException } from '../app-http.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const requestContext = {
            method: request.method,
            path: request.url,
            userId: request['user']?.sub,
        };

        if (exception instanceof ThrottlerException) {
            const rateLimitException = new RateLimitExceededException();
            response
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .setHeader('Retry-After', '60')
                .json(rateLimitException.getResponse());
            return;
        }

        if (exception instanceof ClientFriendlyHttpException) {
            const status = exception.getStatus();
            response.status(status).json(exception.getResponse());
            return;
        }

        if (exception instanceof AppHttpException) {
            this.logger.error(
                JSON.stringify({
                    ...requestContext,
                    errorCode: exception.errorCode,
                    message: exception.message,
                    details: exception.details,
                    status: exception.getStatus(),
                }),
                exception.stack,
            );
        } else if (exception instanceof Error) {
            this.logger.error(
                JSON.stringify({
                    ...requestContext,
                    message: exception.message,
                }),
                exception.stack,
            );
        } else {
            this.logger.error(
                JSON.stringify({
                    ...requestContext,
                    error: exception,
                }),
            );
        }

        response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json(new OperationFailedException().getResponse());
    }
}
