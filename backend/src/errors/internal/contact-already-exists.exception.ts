import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class ContactAlreadyExistsException extends AppHttpException {
    constructor() {
        super(InternalErrors.CONTACT_002, 'Contact already exists');
    }
}
