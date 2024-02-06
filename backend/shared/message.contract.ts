import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const MessageSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  at: z.date(),
  message: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

export const messageContract = c.router({
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
      fromUserId: z.string(),
      toUserId: z.string(),
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
});
