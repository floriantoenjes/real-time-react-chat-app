import { Errors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class EmailAlreadyTakenException extends ClientFriendlyHttpException {
    constructor() {
        super(Errors.AUTH_001, 'Email already taken', null);
    }
}
