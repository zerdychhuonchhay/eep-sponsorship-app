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
            riskLevel: 3, transportation: TransportationType.WALKING, hasSponsorshipContract: false,
        };

        if (isEdit && student) {
            return {
                ...initialData, ...student,
                dateOfBirth: formatDateForInput(student.dateOfBirth),
                eepEnrollDate: formatDateForInput(student.eepEnrollDate),
                applicationDate: formatDateForInput(student.applicationDate),
                outOfProgramDate: formatDateForInput(student.outOfProgramDate),
                profilePhoto: undefined, // Clear photo on edit form load, only handle new uploads
                sponsor: student.sponsor || '', // Ensure sponsor is an ID string
            };
        }
        return initialData;
    });

    const validateField = useCallback((name: string, value: string, currentData: typeof formData) => {
        const getDate = (dateString?: string) => {
            if (!dateString) return null;
            const date = new Date(dateString);
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
            return date;
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dob = getDate(currentData.dateOfBirth);
        const enrollDate = getDate(currentData.eepEnrollDate);
        const appDate = getDate(currentData.applicationDate);
        const outDate = getDate(currentData.outOfProgramDate);

        switch (name) {
            case 'dateOfBirth':
                if (getDate(value) && getDate(value)! > today) return "Date of birth cannot be in the future.";
                break;
            case 'eepEnrollDate':
                if (dob && getDate(value) && getDate(value)! < dob) return "Enroll date cannot be before date of birth.";
                break;
            case 'applicationDate':
                if (dob && getDate(value) && getDate(value)! < dob) return "Application date cannot be before date of birth.";
                break;
            case 'outOfProgramDate':
                if (enrollDate && getDate(value) && getDate(value)! < enrollDate) return "Out of program date cannot be before the enroll date.";
                break;
            default:
                break;
        }
        return '';
    }, []);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        const updatedFormData = { ...formData };

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            (updatedFormData as any)[parent] = { ...(updatedFormData as any)[parent], [child]: value };
        } else {
            const isCheckbox = type === 'checkbox' && (e.target as HTMLInputElement).checked !== undefined;
            const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
            (updatedFormData as any)[name] = val;
        }
        
        setFormData(updatedFormData);
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const error = validateField(name, value, formData);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, profilePhoto: e.target.files![0] }));
        }
    };
    
    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const fieldsToValidate: (keyof typeof formData)[] = ['dateOfBirth', 'eepEnrollDate', 'applicationDate', 'outOfProgramDate'];
        
        fieldsToValidate.forEach(field => {
            const error = validateField(String(field), (formData as any)[field] as string, formData);
            if (error) {
                newErrors[String(field)] = error;
            }
        });
        
        return newErrors;
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            showToast('Please correct the highlighted errors before saving.', 'error');
            return;
        }
        setErrors({});
        const dataToSave = { ...formData, sponsor: formData.sponsor === '' ? null : formData.sponsor };
        onSave(dataToSave);
    };

    const tabs: Tab[] = [
        { id: 'personal', label: 'Personal Info', content: (
            <FormSection title="Personal Information">
                <FormInput label="Student ID" id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} required disabled={isEdit} />
                <FormInput label="First Name" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                <FormInput label="Last Name" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                <FormInput label="Date of Birth" id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} onBlur={handleBlur} required error={errors.dateOfBirth} />
                <FormSelect label="Gender" id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                    {Object.values(Gender).map((g: string) => <option key={g} value={g}>{g}</option>)}
                </FormSelect>
                <FormInput label="Profile Photo" id="profilePhoto" name="profilePhoto" type="file" onChange={handleFileChange} accept="image/*" />
                <div className="md:col-span-2 pt-2">
                    <FormCheckbox label="Has Birth Certificate" id="hasBirthCertificate" name="hasBirthCertificate" checked={!!formData.hasBirthCertificate} onChange={handleChange} />
                </div>
            </FormSection>
        )},
        { id: 'program', label: 'Program Details', content: (
             <FormSection title="Program Details">
                <FormSelect label="Student Status" id="studentStatus" name="studentStatus" value={formData.studentStatus} onChange={handleChange}>
                    {Object.values(StudentStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormSelect label="Sponsorship Status" id="sponsorshipStatus" name="sponsorshipStatus" value={formData.sponsorshipStatus} onChange={handleChange}>
                    {Object.values(SponsorshipStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormSelect label="Sponsor" id="sponsor" name="sponsor" value={formData.sponsor || ''} onChange={handleChange}>
                    <option value="">-- No Sponsor --</option>
                    {sponsorLookup.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </FormSelect>
                <FormInput label="Application Date" id="applicationDate" name="applicationDate" type="date" value={formData.applicationDate} onChange={handleChange} onBlur={handleBlur} required error={errors.applicationDate} />
                <FormInput label="EEP Enroll Date" id="eepEnrollDate" name="eepEnrollDate" type="date" value={formData.eepEnrollDate} onChange={handleChange} onBlur={handleBlur} required error={errors.eepEnrollDate} />
                <FormInput label="Out of Program Date" id="outOfProgramDate" name="outOfProgramDate" type="date" value={formData.outOfProgramDate || ''} onChange={handleChange} onBlur={handleBlur} error={errors.outOfProgramDate} />
                <div className="md:col-span-2 pt-2 flex flex-col sm:flex-row gap-4">
                    <FormCheckbox label="Has Housing Sponsorship" id="hasHousingSponsorship" name="hasHousingSponsorship" checked={!!formData.hasHousingSponsorship} onChange={handleChange} />
                    <FormCheckbox label="Sponsorship Contract on File" id="hasSponsorshipContract" name="hasSponsorshipContract" checked={!!formData.hasSponsorshipContract} onChange={handleChange} />
                </div>
            </FormSection>
        )},
        { id: 'family', label: 'Family & Contact', content: (
            <FormSection title="Family & Contact Information" className="md:grid-cols-2">
                <FormInput label="Guardian Name" id="guardianName" name="guardianName" value={formData.guardianName} onChange={handleChange} />
                <FormInput label="Guardian Contact Info" id="guardianContactInfo" name="guardianContactInfo" value={formData.guardianContactInfo} onChange={handleChange} />
                <FormInput label="Guardian If Not Parents" id="guardianIfNotParents" name="guardianIfNotParents" value={formData.guardianIfNotParents} onChange={handleChange} />
                <FormInput label="Parent Support Level (1-5)" id="parentSupportLevel" name="parentSupportLevel" type="number" min="1" max="5" value={formData.parentSupportLevel} onChange={handleChange} />
                <FormInput label="Home Location" id="homeLocation" name="homeLocation" value={formData.homeLocation} onChange={handleChange} className="md:col-span-2" />
                <FormInput label="City" id="city" name="city" value={formData.city} onChange={handleChange} />
                <FormInput label="Village/Slum" id="villageSlum" name="villageSlum" value={formData.villageSlum} onChange={handleChange} />
                <FormInput label="Siblings Count" id="siblingsCount" name="siblingsCount" type="number" min="0" value={formData.siblingsCount} onChange={handleChange} />
                <FormInput label="Household Members Count" id="householdMembersCount" name="householdMembersCount" type="number" min="0" value={formData.householdMembersCount} onChange={handleChange} />
                <FormInput label="Annual Income" id="annualIncome" name="annualIncome" type="number" min="0" value={formData.annualIncome} onChange={handleChange} className="md:col-span-2" />

                <FormSubSection title="Father Details">
                    <YesNoNASelect label="Is Living?" id="fatherDetails.isLiving" name="fatherDetails.isLiving" value={formData.fatherDetails.isLiving} onChange={handleChange} />
                    <YesNoNASelect label="At Home?" id="fatherDetails.isAtHome" name="fatherDetails.isAtHome" value={formData.fatherDetails.isAtHome} onChange={handleChange} />
                    <YesNoNASelect label="Working?" id="fatherDetails.isWorking" name="fatherDetails.isWorking" value={formData.fatherDetails.isWorking} onChange={handleChange} />
                    <FormInput label="Occupation" id="fatherDetails.occupation" name="fatherDetails.occupation" value={formData.fatherDetails.occupation} onChange={handleChange} />
                    <FormInput label="Skills" id="fatherDetails.skills" name="fatherDetails.skills" value={formData.fatherDetails.skills} onChange={handleChange} />
                </FormSubSection>
                <FormSubSection title="Mother Details">
                    <YesNoNASelect label="Is Living?" id="motherDetails.isLiving" name="motherDetails.isLiving" value={formData.motherDetails.isLiving} onChange={handleChange} />
                    <YesNoNASelect label="At Home?" id="motherDetails.isAtHome" name="motherDetails.isAtHome" value={formData.motherDetails.isAtHome} onChange={handleChange} />
                    <YesNoNASelect label="Working?" id="motherDetails.isWorking" name="motherDetails.isWorking" value={formData.motherDetails.isWorking} onChange={handleChange} />
                    <FormInput label="Occupation" id="motherDetails.occupation" name="motherDetails.occupation" value={formData.motherDetails.occupation} onChange={handleChange} />
                    <FormInput label="Skills" id="motherDetails.skills" name="motherDetails.skills" value={formData.motherDetails.skills} onChange={handleChange} />
                </FormSubSection>
            </FormSection>
        )},
        { id: 'schooling', label: 'School & Health', content: (
            <FormSection title="Schooling & Health">
                <FormInput label="School" id="school" name="school" value={formData.school} onChange={handleChange} />
                <FormInput label="Current Grade" id="currentGrade" name="currentGrade" value={formData.currentGrade} onChange={handleChange} />
                <FormInput label="Grade before EEP" id="gradeLevelBeforeEep" name="gradeLevelBeforeEep" value={formData.gradeLevelBeforeEep} onChange={handleChange} />
                <FormInput label="Closest Private School" id="closestPrivateSchool" name="closestPrivateSchool" value={formData.closestPrivateSchool} onChange={handleChange} />
                <YesNoNASelect label="Currently in School?" id="currentlyInSchool" name="currentlyInSchool" value={formData.currentlyInSchool} onChange={handleChange} />
                <YesNoNASelect label="Previous Schooling?" id="previousSchooling" name="previousSchooling" value={formData.previousSchooling} onChange={handleChange} />
                
                <FormSubSection title="Previous Schooling Details" className={formData.previousSchooling === YesNo.YES ? '' : 'hidden'}>
                    <FormInput label="When?" id="previousSchoolingDetails.when" name="previousSchoolingDetails.when" value={formData.previousSchoolingDetails.when} onChange={handleChange} />
                    <FormInput label="How Long?" id="previousSchoolingDetails.howLong" name="previousSchoolingDetails.howLong" value={formData.previousSchoolingDetails.howLong} onChange={handleChange} />
                    <FormInput label="Where?" id="previousSchoolingDetails.where" name="previousSchoolingDetails.where" value={formData.previousSchoolingDetails.where} onChange={handleChange} />
                </FormSubSection>

                <FormSelect label="Health Status" id="healthStatus" name="healthStatus" value={formData.healthStatus} onChange={handleChange}>
                    {Object.values(HealthStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormSelect label="Interaction with Others" id="interactionWithOthers" name="interactionWithOthers" value={formData.interactionWithOthers} onChange={handleChange}>
                    {Object.values(InteractionStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormTextArea label="Health Issues" id="healthIssues" name="healthIssues" value={formData.healthIssues || ''} onChange={handleChange} className="md:col-span-2" />
                <FormTextArea label="Interaction Issues" id="interactionIssues" name="interactionIssues" value={formData.interactionIssues || ''} onChange={handleChange} className="md:col-span-2" />
            </FormSection>
        )},
        { id: 'narrative', label: 'Narrative & Risk', content: (
             <FormSection title="Narrative & Risk Assessment" className="md:grid-cols-2">
                <FormInput label="Risk Level (1-5)" id="riskLevel" name="riskLevel" type="number" min="1" max="5" value={formData.riskLevel} onChange={handleChange} />
                <FormSelect label="Transportation" id="transportation" name="transportation" value={formData.transportation} onChange={handleChange}>
                    {Object.values(TransportationType).map((t: string) => <option key={t} value={t}>{t}</option>)}
                </FormSelect>
                <FormTextArea label="Child Responsibilities" id="childResponsibilities" name="childResponsibilities" value={formData.childResponsibilities} onChange={handleChange} className="md:col-span-2" />
                <FormTextArea label="Child Story" id="childStory" name="childStory" value={formData.childStory} onChange={handleChange} className="md:col-span-2" />
                <FormTextArea label="Other Notes" id="otherNotes" name="otherNotes" value={formData.otherNotes} onChange={handleChange} className="md:col-span-2" />
            </FormSection>
        )}
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