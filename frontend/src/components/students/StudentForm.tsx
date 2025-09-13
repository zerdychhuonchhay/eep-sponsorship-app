import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Student, Gender, StudentStatus, SponsorshipStatus, YesNo, HealthStatus, InteractionStatus, TransportationType } from '@/types.ts';
import { FormInput, FormSelect, FormTextArea, FormCheckbox, FormSection, FormSubSection, YesNoNASelect } from '@/components/forms/FormControls.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import Tabs, { Tab } from '@/components/ui/Tabs.tsx';
import Button from '@/components/ui/Button.tsx';
import { studentSchema, StudentFormData } from '@/schemas/studentSchema.ts';

interface StudentFormProps {
    student?: Student | null;
    onSave: (data: any) => void;
    onCancel: () => void;
    isSaving: boolean;
}

const formatDateForInput = (dateStr?: string | null) => {
    if (!dateStr || isNaN(new Date(dateStr).getTime())) return '';
    return new Date(dateStr).toISOString().split('T')[0];
};

const getInitialValues = (student?: Student | null): StudentFormData => {
    const defaults = {
        studentId: '', firstName: '', lastName: '', dateOfBirth: '', gender: Gender.OTHER,
        school: '', currentGrade: '', eepEnrollDate: '', outOfProgramDate: null, studentStatus: StudentStatus.PENDING_QUALIFICATION,
        sponsorshipStatus: SponsorshipStatus.UNSPONSORED, hasHousingSponsorship: false, sponsor: '', applicationDate: '',
        hasBirthCertificate: false, siblingsCount: 0, householdMembersCount: 0, city: '', villageSlum: '',
        guardianName: '', guardianContactInfo: '', homeLocation: '',
        fatherDetails: { isLiving: YesNo.NA, isAtHome: YesNo.NA, isWorking: YesNo.NA, occupation: '', skills: '' },
        motherDetails: { isLiving: YesNo.NA, isAtHome: YesNo.NA, isWorking: YesNo.NA, occupation: '', skills: '' },
        annualIncome: 0, guardianIfNotParents: '', parentSupportLevel: 3, closestPrivateSchool: '',
        currentlyInSchool: YesNo.NA, previousSchooling: YesNo.NA,
        previousSchoolingDetails: { when: '', howLong: '', where: '' },
        gradeLevelBeforeEep: '', childResponsibilities: '', healthStatus: HealthStatus.AVERAGE, healthIssues: '',
        interactionWithOthers: InteractionStatus.AVERAGE, interactionIssues: '', childStory: '', otherNotes: '',
        riskLevel: 3, transportation: TransportationType.WALKING, hasSponsorshipContract: false
    };

    if (student && student.studentId) {
        return {
            ...defaults,
            ...student,
            dateOfBirth: formatDateForInput(student.dateOfBirth),
            eepEnrollDate: formatDateForInput(student.eepEnrollDate),
            applicationDate: formatDateForInput(student.applicationDate),
            outOfProgramDate: formatDateForInput(student.outOfProgramDate),
        };
    }
    return defaults;
};


const StudentForm: React.FC<StudentFormProps> = ({ student, onSave, onCancel, isSaving }) => {
    const isEdit = !!student?.studentId;
    const { sponsorLookup } = useData();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<StudentFormData>({
        resolver: zodResolver(studentSchema),
        defaultValues: getInitialValues(student),
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };
    
    const onSubmit = (data: StudentFormData) => {
        onSave({ ...data, profilePhoto: selectedFile });
    };

    const tabs: Tab[] = [
        { id: 'core', label: 'Core Info', content: (
             <FormSection title="Student Identity">
                <FormInput label="Student ID" id="studentId" {...register('studentId')} required disabled={isEdit} error={errors.studentId?.message} />
                <FormInput label="First Name" id="firstName" {...register('firstName')} required error={errors.firstName?.message} />
                <FormInput label="Last Name" id="lastName" {...register('lastName')} required error={errors.lastName?.message} />
                <FormInput label="Date of Birth" id="dateOfBirth" type="date" {...register('dateOfBirth')} required error={errors.dateOfBirth?.message} />
                <FormSelect label="Gender" id="gender" {...register('gender')} error={errors.gender?.message}>
                    {Object.values(Gender).map((g: Gender) => <option key={g} value={g}>{g}</option>)}
                </FormSelect>
                <FormInput label="Profile Photo" id="profilePhoto" name="profilePhoto" type="file" onChange={handleFileChange} />
             </FormSection>
        ) },
        { id: 'program', label: 'Program Details', content: (
            <FormSection title="Program & Sponsorship Information">
                <FormSelect label="Student Status" id="studentStatus" {...register('studentStatus')} error={errors.studentStatus?.message}>
                    {Object.values(StudentStatus).map((s: StudentStatus) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormSelect label="Sponsorship Status" id="sponsorshipStatus" {...register('sponsorshipStatus')} error={errors.sponsorshipStatus?.message}>
                    {Object.values(SponsorshipStatus).map((s: SponsorshipStatus) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                 <FormSelect label="Sponsor" id="sponsor" {...register('sponsor')} error={errors.sponsor?.message}>
                    <option value="">-- Select Sponsor --</option>
                    {sponsorLookup.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </FormSelect>
                <FormInput label="School" id="school" {...register('school')} error={errors.school?.message} />
                <FormInput label="Current Grade" id="currentGrade" {...register('currentGrade')} error={errors.currentGrade?.message} />
                <FormInput label="EEP Enroll Date" id="eepEnrollDate" type="date" {...register('eepEnrollDate')} required error={errors.eepEnrollDate?.message} />
                <FormInput label="Out of Program Date" id="outOfProgramDate" type="date" {...register('outOfProgramDate')} error={errors.outOfProgramDate?.message} />
                <FormInput label="Application Date" id="applicationDate" type="date" {...register('applicationDate')} error={errors.applicationDate?.message} />
                <FormCheckbox label="Has Housing Sponsorship" id="hasHousingSponsorship" {...register('hasHousingSponsorship')} error={errors.hasHousingSponsorship?.message} />
                <FormCheckbox label="Has Sponsorship Contract" id="hasSponsorshipContract" {...register('hasSponsorshipContract')} error={errors.hasSponsorshipContract?.message} />
             </FormSection>
        ) },
        { id: 'family', label: 'Family Details', content: (
            <FormSection title="Family & Household Information">
                <FormInput label="Guardian Name" id="guardianName" {...register('guardianName')} error={errors.guardianName?.message} />
                <FormInput label="Guardian Contact Info" id="guardianContactInfo" {...register('guardianContactInfo')} error={errors.guardianContactInfo?.message} />
                <FormInput label="Guardian If Not Parents" id="guardianIfNotParents" {...register('guardianIfNotParents')} error={errors.guardianIfNotParents?.message} />
                <FormInput label="Home Location" id="homeLocation" {...register('homeLocation')} error={errors.homeLocation?.message} />
                <FormInput label="City" id="city" {...register('city')} error={errors.city?.message} />
                <FormInput label="Village/Slum" id="villageSlum" {...register('villageSlum')} error={errors.villageSlum?.message} />
                <FormInput label="Annual Household Income" id="annualIncome" type="number" {...register('annualIncome')} error={errors.annualIncome?.message} />
                <FormInput label="Number of Siblings" id="siblingsCount" type="number" {...register('siblingsCount')} error={errors.siblingsCount?.message} />
                <FormInput label="Household Members" id="householdMembersCount" type="number" {...register('householdMembersCount')} error={errors.householdMembersCount?.message} />
                <FormCheckbox label="Has Birth Certificate" id="hasBirthCertificate" {...register('hasBirthCertificate')} error={errors.hasBirthCertificate?.message} />
                
                <FormSubSection title="Father's Details">
                    <YesNoNASelect label="Is Living?" id="father_isLiving" {...register('fatherDetails.isLiving')} error={errors.fatherDetails?.isLiving?.message} />
                    <YesNoNASelect label="Is at Home?" id="father_isAtHome" {...register('fatherDetails.isAtHome')} error={errors.fatherDetails?.isAtHome?.message} />
                    <YesNoNASelect label="Is Working?" id="father_isWorking" {...register('fatherDetails.isWorking')} error={errors.fatherDetails?.isWorking?.message} />
                    <FormInput label="Occupation" id="father_occupation" {...register('fatherDetails.occupation')} error={errors.fatherDetails?.occupation?.message} />
                </FormSubSection>
                 <FormSubSection title="Mother's Details">
                    <YesNoNASelect label="Is Living?" id="mother_isLiving" {...register('motherDetails.isLiving')} error={errors.motherDetails?.isLiving?.message} />
                    <YesNoNASelect label="Is at Home?" id="mother_isAtHome" {...register('motherDetails.isAtHome')} error={errors.motherDetails?.isAtHome?.message} />
                    <YesNoNASelect label="Is Working?" id="mother_isWorking" {...register('motherDetails.isWorking')} error={errors.motherDetails?.isWorking?.message} />
                    <FormInput label="Occupation" id="mother_occupation" {...register('motherDetails.occupation')} error={errors.motherDetails?.occupation?.message} />
                </FormSubSection>
            </FormSection>
        ) },
        { id: 'assessment', label: 'Assessment', content: (
            <FormSection title="Health & Background Assessment">
                <FormSelect label="Health Status" id="healthStatus" {...register('healthStatus')} error={errors.healthStatus?.message}>
                    {Object.values(HealthStatus).map((s: HealthStatus) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                 <FormSelect label="Interaction with Others" id="interactionWithOthers" {...register('interactionWithOthers')} error={errors.interactionWithOthers?.message}>
                    {Object.values(InteractionStatus).map((s: InteractionStatus) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormTextArea label="Health Issues" id="healthIssues" {...register('healthIssues')} error={errors.healthIssues?.message} />
                <FormTextArea label="Interaction Issues" id="interactionIssues" {...register('interactionIssues')} error={errors.interactionIssues?.message} />
                <FormInput label="Parent Support Level (1-5)" id="parentSupportLevel" type="number" min="1" max="5" {...register('parentSupportLevel')} error={errors.parentSupportLevel?.message} />
                <FormInput label="Risk Level (1-5)" id="riskLevel" type="number" min="1" max="5" {...register('riskLevel')} error={errors.riskLevel?.message} />
                <FormTextArea label="Child Story" id="childStory" {...register('childStory')} className="md:col-span-2" error={errors.childStory?.message} />
                <FormTextArea label="Other Notes" id="otherNotes" {...register('otherNotes')} className="md:col-span-2" error={errors.otherNotes?.message} />
                <FormTextArea label="Child's Responsibilities at Home" id="childResponsibilities" {...register('childResponsibilities')} className="md:col-span-2" error={errors.childResponsibilities?.message} />
                 <FormSelect label="Transportation" id="transportation" {...register('transportation')} error={errors.transportation?.message}>
                    {Object.values(TransportationType).map((s: TransportationType) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
            </FormSection>
        ) }
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Tabs tabs={tabs} />
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                <Button type="submit" isLoading={isSaving}>{isEdit ? 'Update Student' : 'Save Student'}</Button>
            </div>
        </form>
    );
};

export default StudentForm;