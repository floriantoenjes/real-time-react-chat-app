import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class UserNotFoundException extends AppHttpException {
    constructor() {
        super(InternalErrors.AUTH_001, 'User not found', null, 404);
    }
}
