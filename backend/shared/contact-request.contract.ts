import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const ContactRequestSchema = z.object({
    _id: z.string(),
    initiatorId: z.string(),
    targetUserId: z.string(),
    sentAt: z.date(),
});

export type ContactRequest = z.infer<typeof ContactRequestSchema>;

export const contactRequestContract = c.router({
    getContactRequestByInitiatorId: {
        method: 'POST',
        path: '/contact-request',
        responses: {
            200: ContactRequestSchema,
        },
        body: z.object({
            initiatorId: z.string(),
        }),
        summary: 'Get a contact request by initiator user id',
    },
    respondToContactRequest: {
        method: 'POST',
        path: '/contact-request/respond',
        responses: {
            200: z.undefined(),
        },
        body: z.object({
            contactRequestId: z.string(),
            accepted: z.boolean(),
        }),
        summary: 'Respond to a contact request',
    },
});
