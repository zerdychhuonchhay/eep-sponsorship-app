import { z } from 'zod';

export const sponsorSchema = z.object({
    name: z.string().min(1, 'Sponsor name is required.'),
    email: z.string().email('Must be a valid email address.'),
    sponsorshipStartDate: z.string().min(1, 'Start date is required.').refine(val => !isNaN(Date.parse(val)), { message: 'A valid date is required.' }),
});

export type SponsorFormData = z.infer<typeof sponsorSchema>;