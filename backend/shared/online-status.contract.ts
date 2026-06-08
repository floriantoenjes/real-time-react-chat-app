import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const onlineStatusContract = c.router({
    getContactsOnlineStatus: {
        method: 'POST',
        path: '/contacts-online-status',
        responses: {
            200: z.record(z.string(), z.boolean()),
        },
        body: z.array(z.string()),
        summary: 'Fetch contacts online status by userId',
    },
});
