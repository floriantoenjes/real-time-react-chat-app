import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const IgnoredUserSchema = z.object({
    userId: z.string(),
    ignoredUserId: z.string(),
    createdAt: z.date(),
});

export type IgnoredUser = z.infer<typeof IgnoredUserSchema>;

export const PaginatedIgnoredUsersSchema = z.object({
    data: z.array(z.string()),
    total: z.number(),
    page: z.number(),
    totalPages: z.number(),
});

export type PaginatedIgnoredUsers = z.infer<typeof PaginatedIgnoredUsersSchema>;

export const ignoredUserContract = c.router({
    ignoreUser: {
        method: 'POST',
        path: '/ignored-users',
        responses: {
            201: z.undefined(),
        },
        body: z.object({
            ignoredUserId: z.string(),
        }),
        summary: 'Ignore a user',
    },

    unignoreUser: {
        method: 'DELETE',
        path: '/ignored-users',
        responses: {
            200: z.undefined(),
        },
        body: z.object({
            ignoredUserId: z.string(),
        }),
        summary: 'Un-ignore a user',
    },

    getIgnoredUsers: {
        method: 'GET',
        path: '/ignored-users',
        responses: {
            200: PaginatedIgnoredUsersSchema,
        },
        query: z.object({
            page: z.number().optional(),
            limit: z.number().optional(),
        }),
        summary: 'Get paginated list of ignored users',
    },

    ignoreFromContactRequest: {
        method: 'POST',
        path: '/contact-requests/ignore',
        responses: {
            201: z.undefined(),
        },
        body: z.object({
            contactRequestId: z.string(),
        }),
        summary: 'Ignore a user from a contact request',
    },
});
