import { z } from 'zod';
import { Gender, StudentStatus, YesNo, HealthStatus, InteractionStatus, TransportationType, PrimaryCaregiver } from '@/types.ts';

const parentDetailsSchema = z.object({
    isLiving: z.nativeEnum(YesNo),
    isAtHome: z.nativeEnum(YesNo),
    isWorking: z.nativeEnum(YesNo),
    occupation: z.string().optional(),
    skills: z.string().optional(),
});

const nullableInt = z.preprocess(
    (val) => (String(val).trim() === '' || val === null || (typeof val === 'number' && isNaN(val)) ? null : val),
    z.coerce.number().int().min(0).nullable().optional()
);

const nullableFloat = z.preprocess(
    (val) => (String(val).trim() === '' || val === null || (typeof val === 'number' && isNaN(val)) ? null : val),
    z.coerce.number().min(0).nullable().optional()
);

export const studentSchema = z.object({
    studentId: z.string().min(1, 'Student ID is required.'),
    firstName: z.string().min(1, 'First name is required.'),
    lastName: z.string().min(1, 'Last name is required.'),
    dateOfBirth: z.string().min(1, 'Date of birth is required.'),
    gender: z.nativeEnum(Gender),
    school: z.string().optional(),
    currentGrade: z.string().optional(),
    eepEnrollDate: z.string().min(1, 'EEP enroll date is required.'),
    outOfProgramDate: z.string().optional().nullable(),
    studentStatus: z.nativeEnum(StudentStatus),
    hasHousingSponsorship: z.boolean(),
    siblingsCount: nullableInt,
    householdMembersCount: nullableInt,
    city: z.string().optional(),
    villageSlum: z.string().optional(),
    guardianName: z.string().optional(),
    guardianContactInfo: z.string().optional(),
    homeLocation: z.string().optional(),
    fatherDetails: parentDetailsSchema,
    motherDetails: parentDetailsSchema,
    annualIncome: nullableFloat,
    primaryCaregiver: z.nativeEnum(PrimaryCaregiver),
    guardianRelationship: z.string().optional(),
    parentSupportLevel: z.preprocess(
        (val) => (val === '' || val === null || (typeof val === 'number' && isNaN(val)) ? undefined : Number(val)),
        z.number().min(1, "Value must be between 1 and 5.").max(5, "Value must be between 1 and 5.")
    ),
    closestPrivateSchool: z.string().optional(),
    currentlyInSchool: z.nativeEnum(YesNo),
    previousSchooling: z.nativeEnum(YesNo),
    previousSchoolingDetails: z.object({
        when: z.string().optional(),
        howLong: z.string().optional(),
        where: z.string().optional(),
    }),
    gradeLevelBeforeEep: z.string().optional(),
    childResponsibilities: z.string().optional(),
    healthStatus: z.nativeEnum(HealthStatus),
    healthIssues: z.string().optional(),
    interactionWithOthers: z.nativeEnum(InteractionStatus),
    interactionIssues: z.string().optional(),
    childStory: z.string().optional(),
    otherNotes: z.string().optional(),
    riskLevel: z.preprocess(
        (val) => (val === '' || val === null || (typeof val === 'number' && isNaN(val)) ? undefined : Number(val)),
        z.number().min(1, "Value must be between 1 and 5.").max(5, "Value must be between 1 and 5.")
    ),
    transportation: z.nativeEnum(TransportationType),
    profilePhoto: z.any().optional().nullable()
}).superRefine((data, ctx) => {
    if (data.primaryCaregiver === PrimaryCaregiver.OTHER && (!data.guardianRelationship || data.guardianRelationship.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['guardianRelationship'],
            message: 'Relationship to child is required when "Other Guardian" is selected.',
        });
    }
});

// We are removing hasBirthCertificate from the form-level validation.
// It will still exist on the Student type, but its management is moved to the Documents tab.
export type StudentFormData = Omit<z.infer<typeof studentSchema>, 'hasBirthCertificate' | 'guardianIfNotParents'> & { hasBirthCertificate?: boolean };
