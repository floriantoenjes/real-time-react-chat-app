import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class UnauthorizedException extends ClientFriendlyHttpException {
    constructor(originalError?: Error) {
        super(
            ExternalErrors.EXT_AUTH_002,
            'Unauthorized',
            null,
            401,
            originalError,
        );
    }
}
