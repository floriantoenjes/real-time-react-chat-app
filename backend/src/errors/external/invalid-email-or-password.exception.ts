import { AppHttpException } from '../app-http.exception';
import { Errors } from '../../../shared/enums/errors.enum';

export class InvalidEmailOrPasswordException extends AppHttpException {
    constructor() {
        super(Errors.SIGN_IN_001, 'Invalid username or password');
    }
}
