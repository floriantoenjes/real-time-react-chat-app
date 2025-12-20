import { AppHttpException } from './app-http.exception';
import { Errors } from '../../shared/enums/errors.enum';

export class ContactNotFoundException extends AppHttpException {
    constructor() {
        super(Errors.MESSAGE_001, 'Contact not found', null, 404);
    }
}
