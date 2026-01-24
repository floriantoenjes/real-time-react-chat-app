import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { MulterError } from 'multer';
import { OperationFailedException } from '../external/operation-failed.exception';
import { RateLimitExceededException } from '../external/rate-limit-exceeded.exception';
import { FileTooLargeException } from '../external/file-too-large.exception';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';
import { AppHttpException } from '../app-http.exception';
import * as Sentry from '@sentry/node';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    @SentryExceptionCaptured()
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const requestContext = {
            method: request.method,
            path: request.url,
            userId: request['user']?.sub,
        };

        Sentry.captureException(exception);

        if (exception instanceof ThrottlerException) {
            const rateLimitException = new RateLimitExceededException();
            response
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .setHeader('Retry-After', '60')
                .json(rateLimitException.getResponse());
            return;
        }

        if (
            exception instanceof MulterError &&
            exception.code === 'LIMIT_FILE_SIZE'
        ) {
            const fileTooLargeException = new FileTooLargeException();
            response
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .json(fileTooLargeException.getResponse());
            return;
        }

        if (exception instanceof ClientFriendlyHttpException) {
            const status = exception.getStatus();

            const logContext: Record<string, unknown> = {
                ...requestContext,
                errorCode: exception.errorCode,
                message: exception.message,
                status,
            };

            if (exception.originalError) {
                logContext.originalError = {
                    name: exception.originalError.name,
                    message: exception.originalError.message,
                    stack: exception.originalError.stack,
                };
            }

            this.logger.warn(JSON.stringify(logContext));

            response.status(status).json(exception.getResponse());
            return;
        }

        if (exception instanceof AppHttpException) {
            const logContext: Record<string, unknown> = {
                ...requestContext,
                errorCode: exception.errorCode,
                message: exception.message,
                details: exception.details,
                status: exception.getStatus(),
            };

            if (exception.originalError) {
                logContext.originalError = {
                    name: exception.originalError.name,
                    message: exception.originalError.message,
                    stack: exception.originalError.stack,
                };
            }

            this.logger.error(JSON.stringify(logContext), exception.stack);
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
