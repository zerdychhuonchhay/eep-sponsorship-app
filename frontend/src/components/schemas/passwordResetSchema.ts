import { z } from 'zod';

export const passwordResetSchema = z.object({
    newPassword1: z.string().min(8, 'Password must be at least 8 characters long.'),
    newPassword2: z.string(),
}).refine(data => data.newPassword1 === data.newPassword2, {
    message: "Passwords do not match.",
    path: ['newPassword2'], // Error will be attached to the confirm password field
});

export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
