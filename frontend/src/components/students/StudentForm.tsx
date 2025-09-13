import React, { useState, useCallback } from 'react';
import { Student, Gender, StudentStatus, SponsorshipStatus, YesNo, HealthStatus, InteractionStatus, TransportationType } from '@/types.ts';
import { FormInput, FormSelect, FormTextArea, FormCheckbox, FormSection, FormSubSection, YesNoNASelect } from '@/components/forms/FormControls.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import Tabs, { Tab } from '@/components/ui/Tabs.tsx';
import Button from '@/components/ui/Button.tsx';

interface StudentFormProps {
    student?: Student | null;
    onSave: (data: any) => void;
    onCancel: () => void;
    isSaving: boolean;
}

const formatDateForInput = (dateStr?: string) => {
    if (!dateStr || isNaN(new Date(dateStr).getTime())) return '';
    return new Date(dateStr).toISOString().split('T')[0];
};

const StudentForm: React.FC<StudentFormProps> = ({ student, onSave, onCancel, isSaving }) => {
    const isEdit = !!student?.studentId;
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { showToast } = useNotification();
    const { sponsorLookup } = useData();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [formData, setFormData] = useState(() => {
        const initialData = {
            studentId: '', firstName: '', lastName: '', dateOfBirth: '', gender: Gender.OTHER, profilePhoto: undefined,
            school: '', currentGrade: '', eepEnrollDate: '', outOfProgramDate: '', studentStatus: StudentStatus.PENDING_QUALIFICATION,
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

        if (isEdit && student) {
            return {
                ...initialData,
                ...student,
                dateOfBirth: formatDateForInput(student.dateOfBirth),
                eepEnrollDate: formatDateForInput(student.eepEnrollDate),
                applicationDate: formatDateForInput(student.applicationDate),
                outOfProgramDate: formatDateForInput(student.outOfProgramDate),
            };
        }
        return initialData;
    });

    const validate = useCallback(() => {
        const newErrors: Record<string, string> = {};
        if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required.';
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required.';
        if (!formData.eepEnrollDate) newErrors.eepEnrollDate = 'EEP enroll date is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? checked : value
        }));
    };

    const handleNestedChange = (parent: 'fatherDetails' | 'motherDetails' | 'previousSchoolingDetails', e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [name]: value
            }
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave({ ...formData, profilePhoto: selectedFile });
        } else {
            showToast('Please fill in all required fields.', 'error');
        }
    };

    const tabs: Tab[] = [
        { id: 'core', label: 'Core Info', content: (
             <FormSection title="Student Identity">
                <FormInput label="Student ID" id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} required disabled={isEdit} error={errors.studentId} />
                <FormInput label="First Name" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required error={errors.firstName} />
                <FormInput label="Last Name" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required error={errors.lastName} />
                <FormInput label="Date of Birth" id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required error={errors.dateOfBirth} />
                <FormSelect label="Gender" id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                    {Object.values(Gender).map((g: Gender) => <option key={g} value={g}>{g}</option>)}
                </FormSelect>
                <FormInput label="Profile Photo" id="profilePhoto" name="profilePhoto" type="file" onChange={handleFileChange} />
             </FormSection>
        ) },
        { id: 'program', label: 'Program Details', content: (
            <FormSection title="Program & Sponsorship Information">
                <FormSelect label="Student Status" id="studentStatus" name="studentStatus" value={formData.studentStatus} onChange={handleChange}>
                    {Object.values(StudentStatus).map((s: StudentStatus) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormSelect label="Sponsorship Status" id="sponsorshipStatus" name="sponsorshipStatus" value={formData.sponsorshipStatus} onChange={handleChange}>
                    {Object.values(SponsorshipStatus).map((s: SponsorshipStatus) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                 <FormSelect label="Sponsor" id="sponsor" name="sponsor" value={formData.sponsor} onChange={handleChange}>
                    <option value="">-- Select Sponsor --</option>
                    {sponsorLookup.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </FormSelect>
                <FormInput label="School" id="school" name="school" value={formData.school} onChange={handleChange} />
                <FormInput label="Current Grade" id="currentGrade" name="currentGrade" value={formData.currentGrade} onChange={handleChange} />
                <FormInput label="EEP Enroll Date" id="eepEnrollDate" name="eepEnrollDate" type="date" value={formData.eepEnrollDate} onChange={handleChange} required error={errors.eepEnrollDate} />
                <FormInput label="Out of Program Date" id="outOfProgramDate" name="outOfProgramDate" type="date" value={formData.outOfProgramDate} onChange={handleChange} />
                <FormInput label="Application Date" id="applicationDate" name="applicationDate" type="date" value={formatDateForInput(formData.applicationDate)} onChange={handleChange} />
                <FormCheckbox label="Has Housing Sponsorship" id="hasHousingSponsorship" name="hasHousingSponsorship" checked={formData.hasHousingSponsorship} onChange={handleChange} />
                <FormCheckbox label="Has Sponsorship Contract" id="hasSponsorshipContract" name="hasSponsorshipContract" checked={formData.hasSponsorshipContract} onChange={handleChange} />
             </FormSection>
        ) },
        { id: 'family', label: 'Family Details', content: (
            <FormSection title="Family & Household Information">
                <FormInput label="Guardian Name" id="guardianName" name="guardianName" value={formData.guardianName} onChange={handleChange} />
                <FormInput label="Guardian Contact Info" id="guardianContactInfo" name="guardianContactInfo" value={formData.guardianContactInfo} onChange={handleChange} />
                <FormInput label="Guardian If Not Parents" id="guardianIfNotParents" name="guardianIfNotParents" value={formData.guardianIfNotParents} onChange={handleChange} />
                <FormInput label="Home Location" id="homeLocation" name="homeLocation" value={formData.homeLocation} onChange={handleChange} />
                <FormInput label="City" id="city" name="city" value={formData.city} onChange={handleChange} />
                <FormInput label="Village/Slum" id="villageSlum" name="villageSlum" value={formData.villageSlum} onChange={handleChange} />
                <FormInput label="Annual Household Income" id="annualIncome" name="annualIncome" type="number" value={formData.annualIncome} onChange={handleChange} />
                <FormInput label="Number of Siblings" id="siblingsCount" name="siblingsCount" type="number" value={formData.siblingsCount} onChange={handleChange} />
                <FormInput label="Household Members" id="householdMembersCount" name="householdMembersCount" type="number" value={formData.householdMembersCount} onChange={handleChange} />
                <FormCheckbox label="Has Birth Certificate" id="hasBirthCertificate" name="hasBirthCertificate" checked={formData.hasBirthCertificate} onChange={handleChange} />
                
                <FormSubSection title="Father's Details">
                    <YesNoNASelect label="Is Living?" id="father_isLiving" name="isLiving" value={formData.fatherDetails.isLiving} onChange={e => handleNestedChange('fatherDetails', e)} />
                    <YesNoNASelect label="Is at Home?" id="father_isAtHome" name="isAtHome" value={formData.fatherDetails.isAtHome} onChange={e => handleNestedChange('fatherDetails', e)} />
                    <YesNoNASelect label="Is Working?" id="father_isWorking" name="isWorking" value={formData.fatherDetails.isWorking} onChange={e => handleNestedChange('fatherDetails', e)} />
                    <FormInput label="Occupation" id="father_occupation" name="occupation" value={formData.fatherDetails.occupation} onChange={e => handleNestedChange('fatherDetails', e)} />
                </FormSubSection>
                 <FormSubSection title="Mother's Details">
                    <YesNoNASelect label="Is Living?" id="mother_isLiving" name="isLiving" value={formData.motherDetails.isLiving} onChange={e => handleNestedChange('motherDetails', e)} />
                    <YesNoNASelect label="Is at Home?" id="mother_isAtHome" name="isAtHome" value={formData.motherDetails.isAtHome} onChange={e => handleNestedChange('motherDetails', e)} />
                    <YesNoNASelect label="Is Working?" id="mother_isWorking" name="isWorking" value={formData.motherDetails.isWorking} onChange={e => handleNestedChange('motherDetails', e)} />
                    <FormInput label="Occupation" id="mother_occupation" name="occupation" value={formData.motherDetails.occupation} onChange={e => handleNestedChange('motherDetails', e)} />
                </FormSubSection>
            </FormSection>
        ) },
        { id: 'assessment', label: 'Assessment', content: (
            <FormSection title="Health & Background Assessment">
                <FormSelect label="Health Status" id="healthStatus" name="healthStatus" value={formData.healthStatus} onChange={handleChange}>
                    {Object.values(HealthStatus).map((s: HealthStatus) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                 <FormSelect label="Interaction with Others" id="interactionWithOthers" name="interactionWithOthers" value={formData.interactionWithOthers} onChange={handleChange}>
                    {Object.values(InteractionStatus).map((s: InteractionStatus) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormTextArea label="Health Issues" id="healthIssues" name="healthIssues" value={formData.healthIssues} onChange={handleChange} />
                <FormTextArea label="Interaction Issues" id="interactionIssues" name="interactionIssues" value={formData.interactionIssues} onChange={handleChange} />
                <FormInput label="Parent Support Level (1-5)" id="parentSupportLevel" name="parentSupportLevel" type="number" min="1" max="5" value={formData.parentSupportLevel} onChange={handleChange} />
                <FormInput label="Risk Level (1-5)" id="riskLevel" name="riskLevel" type="number" min="1" max="5" value={formData.riskLevel} onChange={handleChange} />
                <FormTextArea label="Child Story" id="childStory" name="childStory" value={formData.childStory} onChange={handleChange} className="md:col-span-2" />
                <FormTextArea label="Other Notes" id="otherNotes" name="otherNotes" value={formData.otherNotes} onChange={handleChange} className="md:col-span-2" />
                <FormTextArea label="Child's Responsibilities at Home" id="childResponsibilities" name="childResponsibilities" value={formData.childResponsibilities} onChange={handleChange} className="md:col-span-2" />
                 <FormSelect label="Transportation" id="transportation" name="transportation" value={formData.transportation} onChange={handleChange}>
                    {Object.values(TransportationType).map((s: TransportationType) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
            </FormSection>
        ) }
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs tabs={tabs} />
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                <Button type="submit" isLoading={isSaving}>{isEdit ? 'Update Student' : 'Save Student'}</Button>
            </div>
        </form>
    );
};

export default StudentForm;