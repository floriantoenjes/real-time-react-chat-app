// src/common/exceptions/http-exception.filter.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class AppHttpException extends HttpException {
    constructor(
        public readonly errorCode: string,
        public readonly message: string,
        public readonly details?: any,
        statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(
            {
                errorCode,
                message,
                details,
                timestamp: new Date().toISOString(),
            },
            statusCode,
        );
    }
}
