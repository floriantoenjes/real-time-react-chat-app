import { HttpStatus } from '@nestjs/common';
import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export const MAX_FILE_SIZE_MB = 15;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export class FileTooLargeException extends ClientFriendlyHttpException {
    constructor() {
        super(
            ExternalErrors.EXT_FILE_001,
            `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB}MB.`,
            { maxSizeBytes: MAX_FILE_SIZE_BYTES, maxSizeMB: MAX_FILE_SIZE_MB },
            HttpStatus.PAYLOAD_TOO_LARGE,
        );
    }
}
