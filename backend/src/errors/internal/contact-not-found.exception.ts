import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class ContactNotFoundException extends AppHttpException {
    constructor() {
        super(InternalErrors.CONTACT_001, 'Contact not found', null, 404);
    }
}
