import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class InvalidEmailOrPasswordException extends ClientFriendlyHttpException {
    constructor() {
        super(ExternalErrors.EXT_SIGN_IN_001, 'Invalid username or password');
    }
}
