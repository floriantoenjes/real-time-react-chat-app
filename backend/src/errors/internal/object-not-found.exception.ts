import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class ObjectNotFoundException extends AppHttpException {
    constructor() {
        super(InternalErrors.AUTH_002, 'Object not found', null, 404);
    }
}
