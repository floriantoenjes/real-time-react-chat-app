import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class EmailAlreadyTakenException extends ClientFriendlyHttpException {
    constructor() {
        super(ExternalErrors.EXT_AUTH_001, 'Email already taken', null);
    }
}
