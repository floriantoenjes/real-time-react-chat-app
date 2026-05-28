import { HttpStatus } from '@nestjs/common';
import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class CannotIgnoreSelfException extends ClientFriendlyHttpException {
    constructor() {
        super(
            ExternalErrors.EXT_IGNORE_001,
            'You cannot ignore yourself',
            null,
            HttpStatus.BAD_REQUEST,
        );
    }
}
