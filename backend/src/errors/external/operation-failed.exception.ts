import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class OperationFailedException extends ClientFriendlyHttpException {
    constructor() {
        super(ExternalErrors.EXT_GENERAL_001, 'Operation failed', null, 500);
    }
}
