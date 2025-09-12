export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export type SortConfig<T> = {
    key: keyof T | string; // Allow string for special keys like 'age'
    order: 'asc' | 'desc';
};

// --- START: RBAC Types ---
export interface PermissionSet {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
}

export type Permissions = Record<string, PermissionSet>; // e.g., { students: PermissionSet, transactions: PermissionSet }

export interface Role {
    id: number;
    name: string;
    permissions?: Permissions;
}
// --- END: RBAC Types ---


export interface User {
    id: number;
    username: string;
    email: string;
    isAdmin: boolean;
    role: string; // Changed from UserRole
    permissions: Permissions; // Detailed permissions for the user's role
}

// New type for user management page
export enum UserStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}

export interface AppUser {
    id: number;
    username: string;
    email: string;
    role: string; // Changed from UserRole
    status: UserStatus;
    lastLogin: string | null;
}


export type StudentLookup = Pick<Student, 'studentId' | 'firstName' | 'lastName'>;
export type SponsorLookup = Pick<Sponsor, 'id' | 'name'>;

export enum Gender {
    MALE = 'Male',
    FEMALE = 'Female',
    OTHER = 'Other',
}

export enum StudentStatus {
    PENDING_QUALIFICATION = 'Pending Qualification',
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}

export enum SponsorshipStatus {
    SPONSORED = 'Sponsored',
    UNSPONSORED = 'Unsponsored',
}

export enum WellbeingStatus {
    GOOD = 'Good',
    AVERAGE = 'Average',
    POOR = 'Poor',
    NA = 'N/A',
}

export enum YesNo {
    YES = 'Yes',
    NO = 'No',
    NA = 'N/A',
}

export enum HealthStatus {
    EXCELLENT = 'Excellent',
    GOOD = 'Good',
    AVERAGE = 'Average',
    ISSUES = 'Issues',
}

export enum InteractionStatus {
    EXCELLENT = 'Excellent',
    GOOD = 'Good',
    AVERAGE = 'Average',
}

export enum TransportationType {
    SCHOOL_BUS = 'School Bus',
    BICYCLE = 'Bicycle',
    WALKING = 'Walking',
    OTHER = 'Other',
}


export const RISK_FACTORS = [
    'Abandonment', 'Emotional Abuse', 'Physical Abuse', 'Sexual Abuse',
    'Addiction (family members)', 'Addiction (child)', 'Bullying', 'Family Debt',
    'Forced Begging', 'Garbage Collection', 'Gang Involvement', 'Sexual Grooming',
    'Housing Insecurity', 'Mental Health Challenges', 'Neglect', 'Orphan',
    'Parent/Guardian Marital Status Change', 'Parent/Guardian in Jail',
    'Physical Health Challenges', 'Drug use/ Drug selling (family members)',
    'Drugs use/ Drug selling (child)', 'Single Parent/ Guardian'
];

export interface ParentDetails {
    isLiving: YesNo;
    isAtHome: YesNo;
    isWorking: YesNo;
    occupation: string;
    skills: string;
}

export interface Student {
    studentId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: Gender;
    profilePhoto?: string;
    
    // --- Core Program Data ---
    school: string;
    currentGrade: string;
    eepEnrollDate: string;
    outOfProgramDate?: string;
    studentStatus: StudentStatus;
    sponsorshipStatus: SponsorshipStatus;
    hasHousingSponsorship: boolean;
    sponsor?: string; // This will hold the Sponsor ID
    sponsorName?: string; // Read-only from backend
    
    // --- Merged from Risk Assessment ---
    applicationDate: string;
    hasBirthCertificate: boolean;
    siblingsCount: number;
    householdMembersCount: number;
    city: string;
    villageSlum: string;
    guardianName: string;
    guardianContactInfo: string;
    homeLocation: string;
    fatherDetails: ParentDetails;
    motherDetails: ParentDetails;
    annualIncome: number;
    guardianIfNotParents: string;
    parentSupportLevel: number; // 1-5
    closestPrivateSchool: string;
    currentlyInSchool: YesNo;
    previousSchooling: YesNo;
    previousSchoolingDetails: {
        when: string;
        howLong: string;
        where: string;
    };
    gradeLevelBeforeEep: string;
    childResponsibilities: string;
    healthStatus: HealthStatus;
    healthIssues: string;

    interactionWithOthers: InteractionStatus;
    interactionIssues: string;
    childStory: string;
    otherNotes: string;
    riskLevel: number; // 1-5
    transportation: TransportationType;
    hasSponsorshipContract: boolean;
    
    // Follow-ups and reports
    academicReports?: AcademicReport[];
    followUpRecords?: FollowUpRecord[];
}


export interface AcademicReport {
    id: string;
    studentId: string;
    studentName?: string; // Added for convenience
    reportPeriod: string;
    gradeLevel: string;
    subjectsAndGrades: string;
    overallAverage: number;
    passFailStatus: 'Pass' | 'Fail';
    teacherComments: string;
}

export interface FollowUpRecord {
    id: string;
    studentId: string;
    childName: string;
    childCurrentAge: number;
    dateOfFollowUp: string;
    location: string;
    parentGuardian: string;

    // Section 2: Well-being
    physicalHealth: WellbeingStatus;
    physicalHealthNotes: string;
    socialInteraction: WellbeingStatus;
    socialInteractionNotes: string;
    homeLife: WellbeingStatus;
    homeLifeNotes: string;
    drugsAlcoholViolence: YesNo;
    drugsAlcoholViolenceNotes: string;

    // Section 2a: Risk Factors
    riskFactorsList: string[];
    riskFactorsDetails: string;
    conditionOfHome: WellbeingStatus;
    conditionOfHomeNotes: string;
    motherWorking: YesNo;
    fatherWorking: YesNo;
    otherFamilyMemberWorking: YesNo;
    currentWorkDetails: string;
    attendingChurch: YesNo;

    // Section 4: EEP Staff Notes
    staffNotes: string;
    changesRecommendations: string;

    // Section 5: Conclusion
    childProtectionConcerns: YesNo;
    humanTraffickingRisk: YesNo;
    completedBy: string;
    dateCompleted: string;
    reviewedBy: string;
    dateReviewed: string;
}


export enum TransactionType {
    INCOME = 'Income',
    EXPENSE = 'Expense',
}

export interface Transaction {
    id: string;
    date: string;
    description: string;
    location: string;
    amount: number;
    type: TransactionType;
    category: string;
    studentId?: string;
}

export enum FilingStatus {
    PENDING = 'Pending',
    SUBMITTED = 'Submitted',
}

export interface GovernmentFiling {
    id: string;
    documentName: string;
    authority: string;
    dueDate: string;
    submissionDate?: string;
    status: FilingStatus;
    attachedFile?: File | string;
}

export enum TaskStatus {
    TO_DO = 'To Do',
    IN_PROGRESS = 'In Progress',
    DONE = 'Done',
}

export enum TaskPriority {
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
}

export interface Task {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    priority: TaskPriority;
    status: TaskStatus;
}

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

export interface AuditLog {
    id: number;
    timestamp: string;
    userIdentifier: string;
    action: AuditAction;
    contentType: string; // e.g., 'student', 'transaction'
    objectId: string;
    objectRepr: string;
    changes: Record<string, { old: any; new: any }> | null;
}

export interface Sponsor {
    id: string;
    name: string;
    email: string;
    sponsorshipStartDate: string;
    sponsoredStudentCount: number;
}