import { HttpStatus } from '@nestjs/common';
import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class UserIsIgnoredException extends ClientFriendlyHttpException {
    constructor() {
        super(
            ExternalErrors.EXT_IGNORE_004,
            'You cannot interact with a user you have ignored',
            null,
            HttpStatus.FORBIDDEN,
        );
    }
}
