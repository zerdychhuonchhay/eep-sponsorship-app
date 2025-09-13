import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@/types.ts';

export const taskSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    description: z.string().optional().nullable(),
    dueDate: z.string().min(1, 'Due date is required.').refine(val => !isNaN(Date.parse(val)), { message: 'A valid date is required.' }),
    priority: z.nativeEnum(TaskPriority),
    status: z.nativeEnum(TaskStatus),
});

export type TaskFormData = z.infer<typeof taskSchema>;
