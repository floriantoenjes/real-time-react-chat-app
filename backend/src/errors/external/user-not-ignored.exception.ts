import { HttpStatus } from '@nestjs/common';
import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class UserNotIgnoredException extends ClientFriendlyHttpException {
    constructor() {
        super(
            ExternalErrors.EXT_IGNORE_003,
            'This user is not ignored',
            null,
            HttpStatus.NOT_FOUND,
        );
    }
}
