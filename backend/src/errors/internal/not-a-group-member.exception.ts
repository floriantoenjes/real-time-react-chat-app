import { AppHttpException } from '../app-http.exception';
import { InternalErrors } from '../../../shared/enums/errors.enum';

export class NotAGroupMemberException extends AppHttpException {
    constructor() {
        super(
            InternalErrors.CONTACT_GROUP_004,
            'User is not a member of this group',
            null,
            403,
        );
    }
}
