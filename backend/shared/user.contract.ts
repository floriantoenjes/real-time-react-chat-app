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
});

export type User = z.infer<typeof UserSchema>;

export const userContract = c.router({
  signIn: {
    method: 'POST',
    path: '/login',
    responses: {
      200: UserSchema,
    },
    body: z.object({
      email: z.string().email(),
      password: z.string(),
    }),
    summary: 'Sign in',
  },
  signUp: {
    method: 'POST',
    path: '/register',
    responses: {
      201: UserSchema,
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
});
