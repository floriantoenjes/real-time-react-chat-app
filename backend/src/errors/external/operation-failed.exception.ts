import { AppHttpException } from '../app-http.exception';
import { Errors } from '../../../shared/enums/errors.enum';

export class OperationFailedException extends AppHttpException {
    constructor() {
        super(Errors.GENERAL_001, 'Operation failed', null, 500);
    }
}
