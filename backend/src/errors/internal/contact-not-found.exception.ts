import { AppHttpException } from '../app-http.exception';
import { Errors } from '../../../shared/enums/errors.enum';

export class ContactNotFoundException extends AppHttpException {
    constructor() {
        super(Errors.CONTACT_001, 'Contact not found', null, 404);
    }
}
