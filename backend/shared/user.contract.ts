import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ContactSchema } from './contact.contract';

const c = initContract();

export const UserSchema = z.object({
    _id: z.string(),
    authUserId: z.string().optional(),
    username: z.string(),
    contacts: z.array(ContactSchema),
    contactGroupIds: z.array(z.string()),
    leftGroupIds: z.array(z.string()),
    avatarFileName: z.string().optional(),
    avatarBase64: z.any().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const userContract = c.router({
    getSignedInUser: {
        method: 'GET',
        path: '/signed-in-user',
        responses: {
            200: UserSchema,
        },
        summary: 'Gets the signed in user',
    },
    getAll: {
        method: 'GET',
        path: '/users',
        responses: {
            200: z.array(UserSchema),
        },
        summary: 'Get all users',
    },
    searchUserByUsername: {
        method: 'POST',
        path: '/users/search',
        responses: {
            200: UserSchema,
        },
        body: z.object({ username: z.string() }),
        summary: 'Search for a user by its username',
    },
    uploadAvatar: {
        method: 'POST',
        path: '/users/avatar',
        contentType: 'multipart/form-data',
        responses: {
            201: z.boolean(),
        },
        body: z.object({
            avatar: z.custom<File>(),
            x: z.string(),
            y: z.string(),
            width: z.string(),
            height: z.string(),
        }),
        summary: 'Upload user avatar',
    },
    loadAvatar: {
        method: 'GET',
        path: '/users/avatar/:userId',
        pathParams: z.object({ userId: z.string() }),
        responses: {
            200: c.type<Uint8Array>(),
        },
        summary: 'Get the users avatar',
    },
});
