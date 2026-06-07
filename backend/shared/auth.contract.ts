import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { UserSchema } from './user.contract';

export const AuthUserSchema = z.object({
    _id: z.string(),
    email: z.string().min(8),
    password: z.string(),
    refreshTokenEncrypted: z.string().optional(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

const c = initContract();

export const authContract = c.router({
    signIn: {
        method: 'POST',
        path: '/login',
        responses: {
            200: z.object({
                authUser: AuthUserSchema,
                accessToken: z.string(),
                refreshToken: z.string(),
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
            204: z.undefined(),
        },
        body: z.undefined(),
        summary: 'Sign out',
    },
    refresh: {
        method: 'POST',
        path: '/refresh',
        responses: {
            200: z.object({
                authUser: AuthUserSchema,
                accessToken: z.string(),
                refreshToken: z.string(),
            }),
        },
        body: z.undefined(),
        summary: 'Refresh sign in via JWT',
    },
    signUp: {
        method: 'POST',
        path: '/register',
        responses: {
            201: z.object({
                authUserId: UserSchema,
                accessToken: z.string(),
                refreshToken: z.string(),
            }),
            400: z.object({ message: z.literal('Already exists') }),
        },
        body: z.object({
            email: z.string().email(),
            password: z.string(),
            username: z.string().min(3).max(15),
        }),
        summary: 'Register',
    },
});
