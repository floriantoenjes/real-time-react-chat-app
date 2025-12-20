import { AppHttpException } from './app-http.exception';
import { Errors } from '../../shared/enums/errors.enum';

export class EmailAlreadyTakenException extends AppHttpException {
    constructor() {
        super(Errors.AUTH_001, 'Email already taken', null);
    }
}
