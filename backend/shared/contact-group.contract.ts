import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { MessageSchema } from './message.contract';

const c = initContract();

export const ContactGroupSchema = z.object({
  _id: z.string(),
  memberIds: z.array(z.string()),
  name: z.string(),
  lastMessage: MessageSchema,
  avatarFileName: z.string().optional(),
  avatarBase64: z.string().optional(),
});

export type ContactGroup = z.infer<typeof ContactGroupSchema>;

export const contactGroupContract = c.router({
  getContactGroups: {
    method: 'POST',
    path: '/contact-groups',
    responses: {
      200: z.array(ContactGroupSchema),
    },
    body: z.object({
      userId: z.string(),
    }),
    summary: 'Get contact groups',
  },
  addContactGroup: {
    method: 'PUT',
    path: '/contact-groups',
    responses: {
      201: ContactGroupSchema,
    },
    body: z.object({
      userId: z.string(),
      name: z.string(),
      memberIds: z.array(z.string()),
    }),
    summary: 'Add a new contact group',
  },
  removeContactGroup: {
    method: 'DELETE',
    path: '/contacts-groups',
    responses: {
      204: z.boolean(),
    },
    body: z.object({
      userId: z.string(),
      contactGroupId: z.string(),
    }),
    summary: 'Remove a contact group',
  },
});
