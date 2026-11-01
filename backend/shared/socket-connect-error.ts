import { ExternalErrors } from './enums/errors.enum';

/**
 * `data` of the `connect_error` a client receives when the server rejects a
 * Socket.IO connection (throttled or not authenticated).
 */
export interface SocketConnectErrorData {
    errorCode: ExternalErrors;
    message: string;
    retryAfterMs?: number;
}
