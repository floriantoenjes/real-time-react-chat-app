import { Jimp } from 'jimp';
import {
    ALLOWED_AUDIO_TYPES,
    ALLOWED_IMAGE_TYPES,
    InvalidFileTypeException,
} from '../errors/external/invalid-file-type.exception';
import * as crypto from 'crypto';

export interface ValidatedFile {
    buffer: Buffer;
    sanitizedFilename: string;
    mimeType: string;
}

const MIME_TO_EXTENSION: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',

    'audio/mp3': 'mp3',
};

export async function validateAndSanitizeImageFile(
    file: Express.Multer.File,
): Promise<ValidatedFile> {
    let image: Awaited<ReturnType<typeof Jimp.fromBuffer>>;

    try {
        image = await Jimp.fromBuffer(file.buffer);
    } catch {
        throw new InvalidFileTypeException();
    }

    const mimeType = image.mime;

    if (!mimeType || !ALLOWED_IMAGE_TYPES.includes(mimeType)) {
        throw new InvalidFileTypeException();
    }

    const sanitizedFilename = sanitizeFilename(file.originalname, mimeType);

    return {
        buffer: file.buffer,
        sanitizedFilename,
        mimeType,
    };
}

export async function validateAndSanitizeAudioFile(
    file: Express.Multer.File,
): Promise<ValidatedFile> {
    const mimeType = file.mimetype;

    if (!mimeType || !ALLOWED_AUDIO_TYPES.includes(mimeType)) {
        throw new InvalidFileTypeException();
    }

    const sanitizedFilename = sanitizeFilename(file.originalname, mimeType);

    return {
        buffer: file.buffer,
        sanitizedFilename,
        mimeType,
    };
}

function sanitizeFilename(originalName: string, mimeType: string): string {
    // Remove path traversal sequences
    let sanitized = originalName.replace(/\.\.\//g, '').replace(/\.\.\\/g, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Extract the base name without extension
    const lastDotIndex = sanitized.lastIndexOf('.');
    const baseName =
        lastDotIndex > 0 ? sanitized.substring(0, lastDotIndex) : sanitized;

    // Allow only safe characters: alphanumeric, underscore, hyphen
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Limit base name length
    const truncatedBaseName = safeBaseName.substring(0, 200);

    // Generate unique prefix: timestamp + random string
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(8).toString('hex');

    // Get extension from validated MIME type
    const extension = MIME_TO_EXTENSION[mimeType] || 'bin';

    return `${timestamp}_${randomSuffix}_${truncatedBaseName}.${extension}`;
}
