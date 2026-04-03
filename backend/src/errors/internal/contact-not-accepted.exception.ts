import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class ContactNotAcceptedException extends AppHttpException {
    constructor() {
        super(InternalErrors.CONTACT_003, 'Contact not accepted');
    }
}
