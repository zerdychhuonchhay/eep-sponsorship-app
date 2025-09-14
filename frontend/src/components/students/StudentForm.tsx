import React from 'react';
import { Student, Gender, StudentStatus, SponsorshipStatus, YesNo, HealthStatus, InteractionStatus, TransportationType } from '@/types.ts';
import { FormInput, FormSelect, FormTextArea, FormCheckbox, FormSection, FormSubSection, YesNoNASelect } from '@/components/forms/FormControls.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import Tabs, { Tab } from '@/components/ui/Tabs.tsx';
import Button from '@/components/ui/Button.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formatDateForInput = (dateStr?: string | null) => {
    if (!dateStr || isNaN(new Date(dateStr).getTime())) return '';
    return new Date(dateStr).toISOString().split('T')[0];
};

const parentDetailsSchema = z.object({
    isLiving: z.nativeEnum(YesNo),
    isAtHome: z.nativeEnum(YesNo),
    isWorking: z.nativeEnum(YesNo),
    occupation: z.string().optional(),
    skills: z.string().optional(),
});

const studentSchema = z.object({
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
    sponsorshipStatus: z.nativeEnum(SponsorshipStatus),
    hasHousingSponsorship: z.boolean(),
    sponsor: z.string().optional(),
    applicationDate: z.string().optional(),
    hasBirthCertificate: z.boolean(),
    siblingsCount: z.number().int().min(0).optional(),
    householdMembersCount: z.number().int().min(0).optional(),
    city: z.string().optional(),
    villageSlum: z.string().optional(),
    guardianName: z.string().optional(),
    guardianContactInfo: z.string().optional(),
    homeLocation: z.string().optional(),
    fatherDetails: parentDetailsSchema,
    motherDetails: parentDetailsSchema,
    annualIncome: z.number().min(0).optional(),
    guardianIfNotParents: z.string().optional(),
    parentSupportLevel: z.number().min(1).max(5),
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
    riskLevel: z.number().min(1).max(5),
    transportation: z.nativeEnum(TransportationType),
    hasSponsorshipContract: z.boolean(),
    profilePhoto: z.any().optional().nullable()
});

export type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormProps {
    student: Student;
    onSave: (student: any) => void;
    onCancel: () => void;
    isSaving: boolean;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, onSave, onCancel, isSaving }) => {
    const isEdit = !!student.studentId;
    const { sponsorLookup: sponsors } = useData();
    
    const { register, handleSubmit, formState: { errors }, watch } = useForm<StudentFormData>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            studentId: student?.studentId || '',
            firstName: student?.firstName || '',
            lastName: student?.lastName || '',
            dateOfBirth: formatDateForInput(student?.dateOfBirth),
            gender: student?.gender || Gender.MALE,
            school: student?.school || '',
            currentGrade: student?.currentGrade || '',
            eepEnrollDate: formatDateForInput(student?.eepEnrollDate) || formatDateForInput(new Date().toISOString()),
            outOfProgramDate: formatDateForInput(student?.outOfProgramDate),
            studentStatus: student?.studentStatus || StudentStatus.ACTIVE,
            sponsorshipStatus: student?.sponsorshipStatus || SponsorshipStatus.UNSPONSORED,
            hasHousingSponsorship: student?.hasHousingSponsorship || false,
            sponsor: student?.sponsor || '',
            applicationDate: formatDateForInput(student?.applicationDate),
            hasBirthCertificate: student?.hasBirthCertificate || false,
            siblingsCount: student?.siblingsCount || 0,
            householdMembersCount: student?.householdMembersCount || 0,
            city: student?.city || '',
            villageSlum: student?.villageSlum || '',
            guardianName: student?.guardianName || '',
            guardianContactInfo: student?.guardianContactInfo || '',
            homeLocation: student?.homeLocation || '',
            fatherDetails: student?.fatherDetails || { isLiving: YesNo.NA, isAtHome: YesNo.NA, isWorking: YesNo.NA, occupation: '', skills: '' },
            motherDetails: student?.motherDetails || { isLiving: YesNo.NA, isAtHome: YesNo.NA, isWorking: YesNo.NA, occupation: '', skills: '' },
            annualIncome: student?.annualIncome || 0,
            guardianIfNotParents: student?.guardianIfNotParents || '',
            parentSupportLevel: student?.parentSupportLevel || 3,
            closestPrivateSchool: student?.closestPrivateSchool || '',
            currentlyInSchool: student?.currentlyInSchool || YesNo.NA,
            previousSchooling: student?.previousSchooling || YesNo.NA,
            previousSchoolingDetails: student?.previousSchoolingDetails || { when: '', howLong: '', where: '' },
            gradeLevelBeforeEep: student?.gradeLevelBeforeEep || '',
            childResponsibilities: student?.childResponsibilities || '',
            healthStatus: student?.healthStatus || HealthStatus.GOOD,
            healthIssues: student?.healthIssues || '',
            interactionWithOthers: student?.interactionWithOthers || InteractionStatus.GOOD,
            interactionIssues: student?.interactionIssues || '',
            childStory: student?.childStory || '',
            otherNotes: student?.otherNotes || '',
            riskLevel: student?.riskLevel || 3,
            transportation: student?.transportation || TransportationType.WALKING,
            hasSponsorshipContract: student?.hasSponsorshipContract || false,
        }
    });
    
    const watchPreviousSchooling = watch('previousSchooling');

    const onSubmit = (data: StudentFormData) => {
        const file = data.profilePhoto instanceof FileList ? data.profilePhoto[0] : undefined;
        onSave({ ...data, profilePhoto: file });
    };

    const CoreProgramData = (
        <FormSection title="Core Program Data">
            <FormInput label="Student ID" id="studentId" {...register('studentId')} disabled={isEdit} error={errors.studentId?.message} />
            <FormSelect label="Status" id="studentStatus" {...register('studentStatus')} error={errors.studentStatus?.message}>
                {Object.values(StudentStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
            </FormSelect>
             <FormSelect label="Sponsorship Status" id="sponsorshipStatus" {...register('sponsorshipStatus')} error={errors.sponsorshipStatus?.message}>
                {Object.values(SponsorshipStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
            </FormSelect>
             <FormSelect label="Sponsor" id="sponsor" {...register('sponsor')} error={errors.sponsor?.message}>
                <option value="">-- No Sponsor --</option>
                {sponsors.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </FormSelect>
            <FormInput label="School" id="school" {...register('school')} error={errors.school?.message} />
            <FormInput label="Current Grade" id="currentGrade" {...register('currentGrade')} error={errors.currentGrade?.message} />
            <FormInput label="EEP Enroll Date" id="eepEnrollDate" type="date" {...register('eepEnrollDate')} error={errors.eepEnrollDate?.message} />
            <FormInput label="Out of Program Date" id="outOfProgramDate" type="date" {...register('outOfProgramDate')} error={errors.outOfProgramDate?.message} />
            <FormCheckbox label="Has Housing Sponsorship?" id="hasHousingSponsorship" {...register('hasHousingSponsorship')} />
            <FormCheckbox label="Has Sponsorship Contract?" id="hasSponsorshipContract" {...register('hasSponsorshipContract')} />
        </FormSection>
    );

    const DetailedInfo = (
        <div className="space-y-4">
            <FormSection title="Personal & Family Details">
                <FormInput label="Application Date" id="applicationDate" type="date" {...register('applicationDate')} error={errors.applicationDate?.message} />
                <FormCheckbox label="Has Birth Certificate?" id="hasBirthCertificate" {...register('hasBirthCertificate')} />
                <FormInput label="Number of Siblings" id="siblingsCount" type="number" {...register('siblingsCount', { valueAsNumber: true })} error={errors.siblingsCount?.message} />
                <FormInput label="Household Members" id="householdMembersCount" type="number" {...register('householdMembersCount', { valueAsNumber: true })} error={errors.householdMembersCount?.message} />
                <FormInput label="City" id="city" {...register('city')} error={errors.city?.message} />
                <FormInput label="Village/Slum" id="villageSlum" {...register('villageSlum')} error={errors.villageSlum?.message} />
                <FormInput label="Guardian Name" id="guardianName" {...register('guardianName')} error={errors.guardianName?.message} />
                <FormInput label="Guardian Contact Info" id="guardianContactInfo" {...register('guardianContactInfo')} error={errors.guardianContactInfo?.message} />
                <FormInput label="Home Location" id="homeLocation" {...register('homeLocation')} error={errors.homeLocation?.message} />
                <FormInput label="Annual Income" id="annualIncome" type="number" {...register('annualIncome', { valueAsNumber: true })} error={errors.annualIncome?.message} />
                <FormInput label="Guardian (if not parents)" id="guardianIfNotParents" {...register('guardianIfNotParents')} error={errors.guardianIfNotParents?.message} />
                <FormInput label="Parental Support Level (1-5)" id="parentSupportLevel" type="number" min="1" max="5" {...register('parentSupportLevel', { valueAsNumber: true })} error={errors.parentSupportLevel?.message} />
            </FormSection>
             <FormSection title="Parents/Guardians">
                <FormSubSection title="Father Details">
                    <YesNoNASelect label="Is Living?" id="fatherLiving" {...register('fatherDetails.isLiving')} />
                    <YesNoNASelect label="Is At Home?" id="fatherAtHome" {...register('fatherDetails.isAtHome')} />
                    <YesNoNASelect label="Is Working?" id="fatherWorking" {...register('fatherDetails.isWorking')} />
                    <FormInput label="Occupation" id="fatherOccupation" {...register('fatherDetails.occupation')} />
                    <FormInput label="Skills" id="fatherSkills" {...register('fatherDetails.skills')} />
                </FormSubSection>
                <FormSubSection title="Mother Details">
                    <YesNoNASelect label="Is Living?" id="motherLiving" {...register('motherDetails.isLiving')} />
                    <YesNoNASelect label="Is At Home?" id="motherAtHome" {...register('motherDetails.isAtHome')} />
                    <YesNoNASelect label="Is Working?" id="motherWorking" {...register('motherDetails.isWorking')} />
                    <FormInput label="Occupation" id="motherOccupation" {...register('motherDetails.occupation')} />
                    <FormInput label="Skills" id="motherSkills" {...register('motherDetails.skills')} />
                </FormSubSection>
            </FormSection>
        </div>
    );
    
     const NarrativeInfo = (
        <div className="space-y-4">
             <FormSection title="Education & Health">
                <YesNoNASelect label="Currently in School?" id="currentlyInSchool" {...register('currentlyInSchool')} error={errors.currentlyInSchool?.message} />
                <FormInput label="Grade before EEP" id="gradeLevelBeforeEep" {...register('gradeLevelBeforeEep')} error={errors.gradeLevelBeforeEep?.message} />
                 <YesNoNASelect label="Previously in School?" id="previousSchooling" {...register('previousSchooling')} error={errors.previousSchooling?.message} />
                {watchPreviousSchooling === YesNo.YES && (
                    <FormSubSection title="Previous Schooling Details">
                        <FormInput label="When?" id="prevSchoolWhen" {...register('previousSchoolingDetails.when')} />
                        <FormInput label="How Long?" id="prevSchoolHowLong" {...register('previousSchoolingDetails.howLong')} />
                        <FormInput label="Where?" id="prevSchoolWhere" {...register('previousSchoolingDetails.where')} />
                    </FormSubSection>
                )}
                <FormInput label="Closest Private School" id="closestPrivateSchool" {...register('closestPrivateSchool')} error={errors.closestPrivateSchool?.message} />
                <FormSelect label="Health Status" id="healthStatus" {...register('healthStatus')} error={errors.healthStatus?.message} >
                    {Object.values(HealthStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormTextArea label="Health Issues/Details" id="healthIssues" {...register('healthIssues')} error={errors.healthIssues?.message} />
             </FormSection>
             <FormSection title="Social & Narrative">
                <FormSelect label="Interaction with Others" id="interactionWithOthers" {...register('interactionWithOthers')} error={errors.interactionWithOthers?.message} >
                    {Object.values(InteractionStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormTextArea label="Interaction Issues" id="interactionIssues" {...register('interactionIssues')} error={errors.interactionIssues?.message} />
                <FormInput label="Risk Level (1-5)" id="riskLevel" type="number" min="1" max="5" {...register('riskLevel', { valueAsNumber: true })} error={errors.riskLevel?.message} />
                 <FormSelect label="Transportation" id="transportation" {...register('transportation')} error={errors.transportation?.message} >
                    {Object.values(TransportationType).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormTextArea label="Child's Responsibilities" id="childResponsibilities" className="md:col-span-2" {...register('childResponsibilities')} error={errors.childResponsibilities?.message} />
                <FormTextArea label="Child's Story" id="childStory" className="md:col-span-2" {...register('childStory')} error={errors.childStory?.message} />
                <FormTextArea label="Other Notes" id="otherNotes" className="md:col-span-2" {...register('otherNotes')} error={errors.otherNotes?.message} />
            </FormSection>
        </div>
    );

    const tabs: Tab[] = [
        { id: 'core', label: 'Program Data', content: CoreProgramData },
        { id: 'details', label: 'Detailed Info', content: DetailedInfo },
        { id: 'narrative', label: 'Narrative & Health', content: NarrativeInfo },
    ];
    
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-4 space-y-4">
                 <FormSection title="Basic Information">
                    <FormInput label="First Name" id="firstName" {...register('firstName')} error={errors.firstName?.message} />
                    <FormInput label="Last Name" id="lastName" {...register('lastName')} error={errors.lastName?.message} />
                    <FormInput label="Date of Birth" id="dateOfBirth" type="date" {...register('dateOfBirth')} error={errors.dateOfBirth?.message} />
                    <FormSelect label="Gender" id="gender" {...register('gender')} error={errors.gender?.message}>
                        {Object.values(Gender).map((g: string) => <option key={g} value={g}>{g}</option>)}
                    </FormSelect>
                    <FormInput label="Profile Photo" id="profilePhoto" type="file" accept="image/*" {...register('profilePhoto')} error={errors.profilePhoto?.message} />
                </FormSection>
                <Tabs tabs={tabs} />
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t border-stroke dark:border-strokedark">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" isLoading={isSaving}>{isEdit ? 'Update Student' : 'Save Student'}</Button>
            </div>
        </form>
    );
};
export default StudentForm;