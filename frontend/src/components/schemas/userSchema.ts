import { z } from 'zod';
import { UserStatus } from '@/types.ts';

export const userSchema = (isEdit = false) => z.object({
    email: isEdit 
        ? z.string() // Not editable, so no validation needed
        : z.string().email('Must be a valid email address.'),
    role: z.string().min(1, 'A role must be selected.'),
    status: z.nativeEnum(UserStatus).optional(), // Only present in edit mode
});

export type UserFormData = z.infer<ReturnType<typeof userSchema>>;