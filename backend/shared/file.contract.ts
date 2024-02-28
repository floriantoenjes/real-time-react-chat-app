import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const FileSchema = z.object({
  file: z.instanceof(File),
  fileType: z.string(),
  fileName: z.string(),
  userId: z.string(),
});

export type File = z.infer<typeof FileSchema>;

export const fileContract = c.router({
  uploadFile: {
    method: 'POST',
    path: '/files',
    contentType: 'multipart/form-data',
    responses: {
      201: z.boolean(),
    },
    body: c.type<{ avatar: File; userId: string }>(),
    summary: 'Upload a file',
  },
  loadFile: {
    method: 'GET',
    path: '/files/:userId/:fileName',
    pathParams: z.object({ userId: z.string(), fileName: z.string() }),
    responses: {
      200: c.type<Uint8Array>(),
    },
    summary: 'Get an uploaded file',
  },
});
