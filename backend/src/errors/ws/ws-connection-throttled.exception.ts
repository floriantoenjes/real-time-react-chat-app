import { ExternalErrors } from '../../../shared/enums/errors.enum';

export interface WsThrottleClientPayload {
    error: string;
    errorCode: string;
    message: string;
    retryAfterMs: number;
}

export class WsConnectionThrottledException extends Error {
    constructor(
        public readonly retryAfterMs: number,
        public readonly errorCode: string = ExternalErrors.EXT_WS_THROTTLE_001,
    ) {
        super('WebSocket connection throttled. Too many connection attempts.');
        this.name = 'WsConnectionThrottledException';
    }

    toClientPayload(): WsThrottleClientPayload {
        return {
            error: 'CONNECTION_THROTTLED',
            errorCode: this.errorCode,
            message: this.message,
            retryAfterMs: this.retryAfterMs,
        };
    }
}
