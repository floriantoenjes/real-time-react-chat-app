import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { MessageSchema } from './message.contract';

const c = initContract();

export const ContactSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  username: z.string(),
  lastMessage: MessageSchema,
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
});
