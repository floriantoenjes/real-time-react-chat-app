import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class ObjectNotFoundException extends AppHttpException {
    constructor(originalError?: Error) {
        super(InternalErrors.AUTH_002, 'Object not found', null, 404, originalError);
    }
}
