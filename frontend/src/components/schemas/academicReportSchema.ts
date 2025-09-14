import { z } from 'zod';

export const academicReportSchema = z.object({
    studentId: z.string().min(1, 'A student must be selected.'),
    reportPeriod: z.string().min(1, 'Report period is required.'),
    gradeLevel: z.string().min(1, 'Grade level is required.'),
    subjectsAndGrades: z.string().optional().nullable(),
    overallAverage: z.number().min(0, 'Average must be non-negative.').optional().nullable(),
    passFailStatus: z.enum(['Pass', 'Fail']),
    teacherComments: z.string().optional().nullable(),
});

export type AcademicReportFormData = z.infer<typeof academicReportSchema>;