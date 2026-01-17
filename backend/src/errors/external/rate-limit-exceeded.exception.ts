import { HttpStatus } from '@nestjs/common';
import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class RateLimitExceededException extends ClientFriendlyHttpException {
    constructor(retryAfter?: number) {
        super(
            ExternalErrors.EXT_RATE_LIMIT_001,
            'Too many requests. Please try again later.',
            retryAfter ? { retryAfter } : undefined,
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }
}
