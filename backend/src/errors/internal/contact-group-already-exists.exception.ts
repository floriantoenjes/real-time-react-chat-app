import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class ContactGroupAlreadyExistsException extends AppHttpException {
    constructor() {
        super(InternalErrors.CONTACT_GROUP_002, 'Contact group already exists');
    }
}
