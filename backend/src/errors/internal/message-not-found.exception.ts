import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class MessageNotFoundException extends AppHttpException {
    constructor() {
        super(InternalErrors.MESSAGE_001, 'Message Not Found', null, 404);
    }
}
