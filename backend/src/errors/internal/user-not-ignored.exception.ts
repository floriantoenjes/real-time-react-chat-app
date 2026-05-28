import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class UserNotIgnoredException extends AppHttpException {
    constructor() {
        super(InternalErrors.IGNORE_003, 'User is not ignored', null, 404);
    }
}
