import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class AlreadyIgnoredException extends AppHttpException {
    constructor() {
        super(InternalErrors.IGNORE_002, 'User is already ignored', null, 400);
    }
}
