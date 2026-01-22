import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const ContactGroupSchema = z.object({
    _id: z.string(),
    memberIds: z.array(z.string()),
    name: z.string(),
    lastMessage: z.string().optional(),
    avatarFileName: z.string().optional(),
    avatarBase64: z.any().optional(),
    createdBy: z.string(),
    createdAt: z.coerce.date(),
});

export type ContactGroup = z.infer<typeof ContactGroupSchema>;

export const contactGroupContract = c.router({
    getContactGroups: {
        method: 'POST',
        path: '/contact-groups',
        responses: {
            200: z.array(ContactGroupSchema),
        },
        body: z.undefined(),
        summary: 'Get contact groups',
    },
    addContactGroup: {
        method: 'PUT',
        path: '/contact-groups',
        responses: {
            200: ContactGroupSchema, // Joined existing group
            201: ContactGroupSchema, // Created new group
        },
        body: z.object({
            name: z.string(),
            memberIds: z.array(z.string()),
        }),
        summary: 'Add a new contact group or join existing one',
    },
    leaveContactGroup: {
        method: 'POST',
        path: '/contact-groups/leave',
        responses: {
            200: z.boolean(),
        },
        body: z.object({
            contactGroupId: z.string(),
        }),
        summary: 'Leave a contact group',
    },
    rejoinContactGroup: {
        method: 'POST',
        path: '/contact-groups/rejoin',
        responses: {
            200: ContactGroupSchema,
        },
        body: z.object({
            contactGroupId: z.string(),
        }),
        summary: 'Rejoin a left contact group',
    },
    getLeftGroups: {
        method: 'POST',
        path: '/contact-groups/left',
        responses: {
            200: z.array(ContactGroupSchema),
        },
        body: z.undefined(),
        summary: 'Get list of left groups',
    },
    removeContactGroup: {
        method: 'DELETE',
        path: '/contacts-groups',
        responses: {
            204: z.boolean(),
        },
        body: z.object({
            contactGroupId: z.string(),
        }),
        summary: 'Remove a contact group',
    },
});
