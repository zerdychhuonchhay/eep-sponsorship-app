import { z } from 'zod';
import { TransactionType } from '@/types.ts';

export const transactionSchema = z.object({
    id: z.string().optional(),
    date: z.string().min(1, 'Date is required.').refine(val => !isNaN(Date.parse(val)), { message: 'A valid date is required.' }),
    description: z.string().min(1, 'Description is required.'),
    location: z.string().optional().nullable(),
    amount: z.number().positive('Amount must be a positive number.'),
    type: z.nativeEnum(TransactionType),
    category: z.string().min(1, 'Category is required.'),
    studentId: z.string().optional().nullable().transform(val => val === '' ? null : val),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;