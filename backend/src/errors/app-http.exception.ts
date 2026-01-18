// src/common/exceptions/http-exception.filter.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class AppHttpException extends HttpException {
    public readonly originalError?: Error;

    constructor(
        public readonly errorCode: string,
        message: string,
        public readonly details?: any,
        statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
        originalError?: Error,
    ) {
        super(
            {
                errorCode,
                message,
                details,
                timestamp: new Date().toISOString(),
            },
            statusCode,
            { cause: originalError },
        );
        this.originalError = originalError;
    }
}
