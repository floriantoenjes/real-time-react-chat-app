import { HttpStatus } from '@nestjs/common';
import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class AlreadyIgnoredException extends ClientFriendlyHttpException {
    constructor() {
        super(
            ExternalErrors.EXT_IGNORE_002,
            'This user is already ignored',
            null,
            HttpStatus.BAD_REQUEST,
        );
    }
}
