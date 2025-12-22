import { AppHttpException } from '../app-http.exception';
import { Errors } from '../../../shared/enums/errors.enum';

export class CannotSignInException extends AppHttpException {
    constructor() {
        super(Errors.SIGN_IN_002, 'Cannot sign in', null, 500);
    }
}
