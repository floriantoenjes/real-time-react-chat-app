import { AppHttpException } from '../app-http.exception';
import { Errors } from '../../../shared/enums/errors.enum';

export class UserNotFoundException extends AppHttpException {
    constructor() {
        super(Errors.AUTH_002, 'User not found', null, 404);
    }
}
