import { Errors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class OperationFailedException extends ClientFriendlyHttpException {
    constructor() {
        super(Errors.GENERAL_001, 'Operation failed', null, 500);
    }
}
