import { z } from 'zod';
import { initContract } from '@ts-rest/core';

const c = initContract();

export const LogMessageSchema = z.object({
    level: z.string(),
    message: z.string(),
    context: z.string().optional(),
    trace: z.string().optional(),
});

export type LogMessage = z.infer<typeof LogMessageSchema>;

export const loggingContract = c.router({
    logMessage: {
        method: 'POST',
        path: '/logging',
        responses: {
            200: z.boolean(),
        },
        body: LogMessageSchema,
        summary: 'Log a message with the CustomLogger',
    },
});
