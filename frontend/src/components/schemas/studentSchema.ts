import { z } from 'zod';
import { Gender, StudentStatus, SponsorshipStatus, YesNo, HealthStatus, InteractionStatus, TransportationType } from '@/types.ts';

const parentDetailsSchema = z.object({
    isLiving: z.nativeEnum(YesNo),
    isAtHome: z.nativeEnum(YesNo),
    isWorking: z.nativeEnum(YesNo),
    occupation: z.string().optional().nullable(),
    skills: z.string().optional().nullable(),
});

const previousSchoolingDetailsSchema = z.object({
    when: z.string().optional().nullable(),
    howLong: z.string().optional().nullable(),
    where: z.string().optional().nullable(),
});

// A custom zod preprocessor to handle empty strings for optional numbers, converting them to undefined so optional validation passes.
const emptyStringToUndefined = z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') return undefined;
    return val;
}, z.unknown());


export const studentSchema = z.object({
    studentId: z.string().min(1, 'Student ID is required.'),
    firstName: z.string().min(1, 'First name is required.'),
    lastName: z.string().min(1, 'Last name is required.'),
    dateOfBirth: z.string().min(1, 'Date of birth is required.').refine(val => !isNaN(Date.parse(val)), { message: 'A valid date is required.' }),
    gender: z.nativeEnum(Gender),

    // Program Details
    school: z.string().optional().nullable(),
    currentGrade: z.string().optional().nullable(),
    eepEnrollDate: z.string().min(1, 'EEP enroll date is required.').refine(val => !isNaN(Date.parse(val)), { message: 'A valid date is required.' }),
    outOfProgramDate: z.string().nullable().optional().transform(val => val === '' ? null : val).refine(val => val === null || val === undefined || !isNaN(Date.parse(val)), { message: 'A valid date is required.' }),
    studentStatus: z.nativeEnum(StudentStatus),
    sponsorshipStatus: z.nativeEnum(SponsorshipStatus),
    hasHousingSponsorship: z.boolean(),
    sponsor: z.string().optional().nullable(),
    applicationDate: z.string().optional().nullable().refine(val => !val || !isNaN(Date.parse(val)), { message: 'A valid date is required.' }),
    
    // Family Details
    hasBirthCertificate: z.boolean(),
    siblingsCount: emptyStringToUndefined.pipe(z.coerce.number().int().nonnegative().optional().nullable()),
    householdMembersCount: emptyStringToUndefined.pipe(z.coerce.number().int().nonnegative().optional().nullable()),
    city: z.string().optional().nullable(),
    villageSlum: z.string().optional().nullable(),
    guardianName: z.string().optional().nullable(),
    guardianContactInfo: z.string().optional().nullable(),
    homeLocation: z.string().optional().nullable(),
    fatherDetails: parentDetailsSchema,
    motherDetails: parentDetailsSchema,
    annualIncome: emptyStringToUndefined.pipe(z.coerce.number().nonnegative().optional().nullable()),
    guardianIfNotParents: z.string().optional().nullable(),
    
    // Assessment
    parentSupportLevel: emptyStringToUndefined.pipe(z.coerce.number().int().min(1).max(5).optional().nullable()),
    closestPrivateSchool: z.string().optional().nullable(),
    currentlyInSchool: z.nativeEnum(YesNo),
    previousSchooling: z.nativeEnum(YesNo),
    previousSchoolingDetails: previousSchoolingDetailsSchema,
    gradeLevelBeforeEep: z.string().optional().nullable(),
    childResponsibilities: z.string().optional().nullable(),
    healthStatus: z.nativeEnum(HealthStatus),
    healthIssues: z.string().optional().nullable(),
    interactionWithOthers: z.nativeEnum(InteractionStatus),
    interactionIssues: z.string().optional().nullable(),
    childStory: z.string().optional().nullable(),
    otherNotes: z.string().optional().nullable(),
    riskLevel: emptyStringToUndefined.pipe(z.coerce.number().int().min(1).max(5).optional().nullable()),
    transportation: z.nativeEnum(TransportationType),
    hasSponsorshipContract: z.boolean(),
});

export type StudentFormData = z.infer<typeof studentSchema>;