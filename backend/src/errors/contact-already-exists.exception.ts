import { AppHttpException } from './app-http.exception';
import { Errors } from '../../shared/enums/errors.enum';

export class ContactAlreadyExistsException extends AppHttpException {
    constructor() {
        super(Errors.CONTACT_002, 'Contact already exists');
    }
}
