import { ExternalErrors } from '../../../shared/enums/errors.enum';
import { WsConnectError } from './ws-connect.error';

export class WsConnectionThrottledException extends WsConnectError {
    constructor(public readonly retryAfterMs: number) {
        super(
            ExternalErrors.EXT_WS_THROTTLE_001,
            'WebSocket connection throttled. Too many connection attempts.',
            retryAfterMs,
        );
        this.name = 'WsConnectionThrottledException';
    }
}
