import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class ContactGroupNotFoundException extends AppHttpException {
    constructor() {
        super(
            InternalErrors.CONTACT_GROUP_003,
            'Contact group not found',
            null,
            404,
        );
    }
}
