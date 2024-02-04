import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

const MessageSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  at: z.date(),
  message: z.string(),
});

const ContactSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  username: z.string(),
  lastMessage: MessageSchema,
});

const UserSchema = z.object({
  _id: z.string(),
  email: z.string(),
  password: z.string(),
  username: z.string(),
  contacts: z.array(ContactSchema),
});

export type User = z.infer<typeof UserSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Message = z.infer<typeof MessageSchema>;

export const contract = c.router({
  getMessages: {
    method: 'POST',
    path: '/get-messages',
    responses: {
      200: z.array(MessageSchema),
    },
    body: z.object({
      userId: z.string(),
      contactId: z.string(),
    }),
    summary: 'Get messages for user by username',
  },
  deleteMessages: {
    method: 'DELETE',
    path: '/messages',
    responses: {
      200: z.boolean(),
    },
    body: z.object({
      username: z.string(),
    }),
    summary: 'Delete messages for user by username',
  },
  sendMessage: {
    method: 'POST',
    path: '/send',
    responses: {
      201: z.boolean(),
    },
    body: z.object({
      toUserId: z.string(),
      message: z.string(),
      fromUserId: z.string(),
    }),
    summary: 'Send a message',
  },
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
  signIn: {
    method: 'POST',
    path: '/login',
    responses: {
      200: UserSchema,
    },
    body: z.object({
      email: z.string(),
      password: z.string(),
    }),
    summary: 'Sign in',
  },
});
