import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class CannotIgnoreSelfException extends AppHttpException {
    constructor() {
        super(InternalErrors.IGNORE_001, 'Cannot ignore yourself', null, 400);
    }
}
