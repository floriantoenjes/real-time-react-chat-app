import { AppHttpException } from './app-http.exception';
import { Errors } from '../../shared/enums/errors.enum';

export class UnauthorizedException extends AppHttpException {
    constructor() {
        super(Errors.AUTH_003, 'Unauthorized', 401);
    }
}
