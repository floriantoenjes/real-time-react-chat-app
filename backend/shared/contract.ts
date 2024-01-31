import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

const MessageSchema = z.object({
  from: z.string(),
  at: z.date(),
  message: z.string(),
});

export const contract = c.router({
  getMessages: {
    method: 'POST',
    path: '/get-messages',
    responses: {
      200: z.array(MessageSchema),
    },
    body: z.object({
      username: z.string(),
    }),
    summary: 'Get messages for user by username',
  },
  sendMessage: {
    method: 'POST',
    path: '/send',
    responses: {
      201: z.boolean(),
    },
    body: z.object({
      message: z.string(),
      from: z.string(),
    }),
    summary: 'Send a message',
  },
});
