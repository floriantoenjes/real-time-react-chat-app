import { AppHttpException } from '../app-http.exception';
import { Errors } from '../../../shared/enums/errors.enum';

export class MembersNotFoundException extends AppHttpException {
    constructor() {
        super(
            Errors.CONTACT_GROUP_001,
            'No contact group members found',
            null,
            404,
        );
    }
}
