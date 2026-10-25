import { HttpStatus } from '@nestjs/common';
import { RequestValidationError } from '@ts-rest/nest';
import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export class InvalidRequestException extends ClientFriendlyHttpException {
    constructor(validationError: RequestValidationError) {
        super(
            ExternalErrors.EXT_VALIDATION_001,
            'Invalid request',
            // Which params, headers, query or body fields failed validation
            validationError.getResponse(),
            HttpStatus.BAD_REQUEST,
            validationError,
        );
    }
}
