import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const ContactSchema = z.object({
    _id: z.string(),
    name: z.string(),
    lastMessage: z.string().optional(),
    avatarFileName: z.string().optional(),
    avatarBase64: z.any().optional(),
});

export type Contact = z.infer<typeof ContactSchema>;

export const contactContract = c.router({
    getContacts: {
        method: 'POST',
        path: '/contacts',
        responses: {
            200: z.array(ContactSchema),
        },
        body: z.object({
            userId: z.string(),
        }),
        summary: 'Get contacts',
    },
    addContact: {
        method: 'PUT',
        path: '/contacts',
        responses: {
            201: ContactSchema,
        },
        body: z.object({
            userId: z.string(),
            newContactId: z.string(),
        }),
        summary: 'Add a new contact',
    },
    removeContact: {
        method: 'DELETE',
        path: '/contacts',
        responses: {
            204: z.boolean(),
        },
        body: z.object({
            userId: z.string(),
            contactId: z.string(),
        }),
        summary: 'Remove a contact',
    },
    getContactsOnlineStatus: {
        method: 'POST',
        path: '/contacts/online',
        responses: {
            200: z.record(z.string(), z.boolean()),
        },
        body: z.array(z.string()),
        summary: 'Fetch online status of contacts by userIds',
    },
});
