import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class UnauthorizedException extends ClientFriendlyHttpException {
    constructor() {
        super(ExternalErrors.EXT_AUTH_002, 'Unauthorized', 401);
    }
}
