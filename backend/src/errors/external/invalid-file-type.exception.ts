import { HttpStatus } from '@nestjs/common';
import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { ClientFriendlyHttpException } from '../client-friendly-http.exception';

export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
];

export const ALLOWED_AUDIO_TYPES = ['audio/mp3'];

export class InvalidFileTypeException extends ClientFriendlyHttpException {
    constructor() {
        super(
            ExternalErrors.EXT_FILE_002,
            `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}.`,
            { allowedTypes: ALLOWED_IMAGE_TYPES },
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
    }
}
