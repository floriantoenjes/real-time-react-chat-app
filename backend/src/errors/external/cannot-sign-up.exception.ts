import { AppHttpException } from '../app-http.exception';
import { Errors } from '../../../shared/enums/errors.enum';

export class CannotSignUpException extends AppHttpException {
    constructor() {
        super(Errors.SIGN_UP_001, 'Cannot sign up', null, 500);
    }
}
