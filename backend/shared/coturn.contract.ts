import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const CoturnCredentialsSchema = z.object({
    username: z.string(),
    password: z.string(),
});

export type CoturnCredentials = z.infer<typeof CoturnCredentialsSchema>;

export const coturnContract = c.router({
    getCredentials: {
        method: 'POST',
        path: '/coturn',
        responses: {
            200: CoturnCredentialsSchema,
        },
        body: z.object({}),
        summary: 'Get coturn credentials',
    },
});
