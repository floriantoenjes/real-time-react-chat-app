import { Controller } from '@nestjs/common';

import * as crypto from 'crypto';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { coturnContract } from '../../shared/coturn.contract';
import { ConfigService } from '@nestjs/config';

@Controller()
export class CoturnController {
    private readonly coturnSecret: string;

    constructor(configService: ConfigService) {
        const coturnSecret = configService.get('COTURN_SECRET');
        if (!coturnSecret) {
            throw new Error('COTURN_SECRET not configured!');
        }
        this.coturnSecret = coturnSecret;
    }

    @TsRestHandler(coturnContract.getCredentials)
    private async getCredentials() {
        return tsRestHandler(
            coturnContract.getCredentials,
            async ({ body }) => {
                const unixTimeStamp = Math.round(Date.now() / 1000) + 24 * 3600; // this credential would be valid for the next 24 hours
                const username = [unixTimeStamp, body.userId].join(':');
                const hmac = crypto.createHmac('sha1', this.coturnSecret);
                hmac.setEncoding('base64');
                hmac.write(username);
                hmac.end();
                const password = hmac.read();

                return {
                    status: 200,
                    body: {
                        username: username,
                        password: password,
                    },
                };
            },
        );
    }
}
