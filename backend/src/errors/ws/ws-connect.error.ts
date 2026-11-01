import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { SocketConnectErrorData } from '../../../shared/socket-connect-error';

/**
 * Error for the Socket.IO connection middleware. Socket.IO sends `message` and
 * `data` to the client as a `connect_error`.
 */
export class WsConnectError extends Error {
    readonly data: SocketConnectErrorData;

    constructor(
        errorCode: ExternalErrors,
        message: string,
        retryAfterMs?: number,
    ) {
        super(message);
        this.name = 'WsConnectError';
        this.data = { errorCode, message, retryAfterMs };
    }
}

export class WsUnauthorizedError extends WsConnectError {
    constructor() {
        super(ExternalErrors.EXT_AUTH_002, 'Unauthorized');
        this.name = 'WsUnauthorizedError';
    }
}
