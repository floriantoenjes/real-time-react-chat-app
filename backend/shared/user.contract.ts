import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ContactSchema } from './contact.contract';
import { ContactGroupSchema } from './contact-group.contract';

const c = initContract();

export const UserSchema = z.object({
    _id: z.string(),
    email: z.string(),
    password: z.string(),
    username: z.string(),
    contacts: z.array(ContactSchema),
    contactGroups: z.array(ContactGroupSchema),
    avatarFileName: z.string().optional(),
    avatarBase64: z.any().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const userContract = c.router({
    getAll: {
        method: 'GET',
        path: '/users',
        responses: {
            200: z.array(UserSchema),
        },
        summary: 'Get all users',
    },
    signIn: {
        method: 'POST',
        path: '/login',
        responses: {
            200: z.object({
                user: UserSchema,
            }),
        },
        body: z.object({
            email: z.string().email(),
            password: z.string(),
        }),
        summary: 'Sign in',
    },
    signOut: {
        method: 'POST',
        path: '/logout',
        responses: {
            204: z.object({}),
        },
        body: z.object({}),
        summary: 'Sign out',
    },
    refresh: {
        method: 'POST',
        path: '/refresh',
        responses: {
            200: z.object({
                user: UserSchema,
            }),
        },
        body: z.object({}),
        summary: 'Refresh sign in via JWT',
    },
    signUp: {
        method: 'POST',
        path: '/register',
        responses: {
            201: z.object({
                user: UserSchema,
                accessToken: z.string(),
                refreshToken: z.string(),
            }),
        },
        body: z.object({
            email: z.string().email(),
            password: z.string(),
            username: z.string().min(3).max(15),
        }),
        summary: 'Register',
    },
    searchUserByUsername: {
        method: 'POST',
        path: '/users/search',
        responses: {
            200: UserSchema,
        },
        body: z.object({ username: z.string() }),
        summary: 'Search for a user by its id',
    },
    uploadAvatar: {
        method: 'POST',
        path: '/users/avatar',
        contentType: 'multipart/form-data',
        responses: {
            201: z.boolean(),
        },
        body: c.type<{
            avatar: File;
            userId: string;
            x: number;
            y: number;
            width: number;
            height: number;
        }>(),
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
