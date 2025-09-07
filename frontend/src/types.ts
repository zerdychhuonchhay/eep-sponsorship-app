

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
    is_living: YesNo;
    is_at_home: YesNo;
    is_working: YesNo;
    occupation: string;
    skills: string;
}

export interface Student {
    student_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: Gender;
    profile_photo?: string;
    
    // --- Core Program Data ---
    school: string;
    current_grade: string;
    eep_enroll_date: string;
    out_of_program_date?: string;
    student_status: StudentStatus;
    sponsorship_status: SponsorshipStatus;
    has_housing_sponsorship: boolean;
    sponsor_name?: string;
    
    // --- Merged from Risk Assessment ---
    application_date: string;
    has_birth_certificate: boolean;
    siblings_count: number;
    household_members_count: number;
    city: string;
    village_slum: string;
    guardian_name: string;
    guardian_contact_info: string;
    home_location: string;
    father_details: ParentDetails;
    mother_details: ParentDetails;
    annual_income: number;
    guardian_if_not_parents: string;
    parent_support_level: number; // 1-5
    closest_private_school: string;
    currently_in_school: YesNo;
    previous_schooling: YesNo;
    previous_schooling_details: {
        when: string;
        how_long: string;
        where: string;
    };
    grade_level_before_eep: string;
    child_responsibilities: string;
    health_status: HealthStatus;
    health_issues: string;
    interaction_with_others: InteractionStatus;
    interaction_issues: string;
    child_story: string;
    other_notes: string;
    risk_level: number; // 1-5
    transportation: TransportationType;
    has_sponsorship_contract: boolean;
    
    // Follow-ups and reports
    academic_reports?: AcademicReport[];
    follow_up_records?: FollowUpRecord[];
}


export interface AcademicReport {
    id: string;
    student_id: string;
    student_name?: string; // Added for convenience
    report_period: string;
    grade_level: string;
    subjects_and_grades: string;
    overall_average: number;
    pass_fail_status: 'Pass' | 'Fail';
    teacher_comments: string;
}

export interface FollowUpRecord {
    id: string;
    student_id: string;
    child_name: string;
    child_current_age: number;
    date_of_follow_up: string;
    location: string;
    parent_guardian: string;

    // Section 2: Well-being
    physical_health: WellbeingStatus;
    physical_health_notes: string;
    social_interaction: WellbeingStatus;
    social_interaction_notes: string;
    home_life: WellbeingStatus;
    home_life_notes: string;
    drugs_alcohol_violence: YesNo;
    drugs_alcohol_violence_notes: string;

    // Section 2a: Risk Factors
    risk_factors_list: string[];
    risk_factors_details: string;
    condition_of_home: WellbeingStatus;
    condition_of_home_notes: string;
    mother_working: YesNo;
    father_working: YesNo;
    other_family_member_working: YesNo;
    current_work_details: string;
    attending_church: YesNo;

    // Section 4: EEP Staff Notes
    staff_notes: string;
    changes_recommendations: string;

    // Section 5: Conclusion
    child_protection_concerns: YesNo;
    human_trafficking_risk: YesNo;
    completed_by: string;
    date_completed: string;
    reviewed_by: string;
    date_reviewed: string;
}


export enum TransactionType {
    INCOME = 'Income',
    EXPENSE = 'Expense',
}

export const TRANSACTION_CATEGORIES = [
    'Donation',
    'Grant',
    'School Fees',
    'Utilities',
    'Salaries',
    'Rent',
    'Supplies',
    'Hot Lunches',
    'Gifts',
    'Transportation',
    'Other Income',
    'Other Expense',
];

export interface Transaction {
    id: string;
    date: string;
    description: string;
    location: string;
    amount: number;
    type: TransactionType;
    category: string;
    student_id?: string;
}

export enum FilingStatus {
    PENDING = 'Pending',
    SUBMITTED = 'Submitted',
}

export interface GovernmentFiling {
    id: string;
    document_name: string;
    authority: string;
    due_date: string;
    submission_date?: string;
    status: FilingStatus;
    attached_file?: File | string;
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