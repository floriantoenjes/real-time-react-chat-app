import { AppHttpException } from '../app-http.exception';
import { Errors } from '../../../shared/enums/errors.enum';

export class ContactGroupNotFoundException extends AppHttpException {
    constructor() {
        super(Errors.CONTACT_GROUP_003, 'Contact group not found', null, 404);
    }
}
