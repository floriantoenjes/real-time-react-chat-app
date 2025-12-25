import { AppHttpException } from './app-http.exception';
import { HttpStatus } from '@nestjs/common';

export class ClientFriendlyHttpException extends AppHttpException {
    constructor(
        public readonly errorCode: string,
        public readonly message: string,
        public readonly details?: any,
        statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(errorCode, message, details, statusCode);
    }
}
