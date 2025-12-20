import { AppHttpException } from './app-http.exception';
import { Errors } from '../../shared/enums/errors.enum';

export class MessageNotFoundException extends AppHttpException {
    constructor() {
        super(Errors.MESSAGE_001, 'Message Not Found', null, 404);
    }
}
