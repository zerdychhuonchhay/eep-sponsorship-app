import { z } from 'zod';
import { FilingStatus } from '@/types.ts';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export const filingSchema = z.object({
    documentName: z.string().min(1, 'Document name is required.'),
    authority: z.string().min(1, 'Authority is required.'),
    dueDate: z.string().min(1, 'Due date is required.').refine(val => !isNaN(Date.parse(val)), { message: 'A valid date is required.' }),
    submissionDate: z.string().nullable().optional().transform(val => val === '' ? null : val).refine(val => val === null || val === undefined || !isNaN(Date.parse(val)), { message: 'A valid date is required.' }),
    status: z.nativeEnum(FilingStatus),
    attachedFile: z.any()
        .refine(files => !files || !(files instanceof FileList) || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
        .refine(files => !files || !(files instanceof FileList) || files.length === 0 || ACCEPTED_FILE_TYPES.includes(files?.[0]?.type), ".pdf, .jpg, .png, and .webp files are accepted.")
        .optional()
        .nullable(),
});

export type FilingFormData = z.infer<typeof filingSchema>;
