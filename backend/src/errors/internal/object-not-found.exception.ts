import { AppHttpException } from '../app-http.exception';
import { Errors } from '../../../shared/enums/errors.enum';

export class ObjectNotFoundException extends AppHttpException {
    constructor() {
        super(Errors.AUTH_004, 'Object not found', null, 404);
    }
}
