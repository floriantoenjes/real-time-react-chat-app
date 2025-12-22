import { AppHttpException } from '../app-http.exception';
import { Errors } from '../../../shared/enums/errors.enum';

export class ContactGroupAlreadyExistsException extends AppHttpException {
    constructor() {
        super(Errors.CONTACT_GROUP_002, 'Contact group already exists');
    }
}
