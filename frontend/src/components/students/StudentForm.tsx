import React, { useState, useEffect, useCallback } from 'react';
import { Student, Gender, StudentStatus, SponsorshipStatus, YesNo, HealthStatus, InteractionStatus, TransportationType, StudentDocument, DocumentType } from '@/types.ts';
import { FormInput, FormSelect, FormTextArea, FormCheckbox, FormSection, FormSubSection, YesNoNASelect } from '@/components/forms/FormControls.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import Tabs, { Tab } from '@/components/ui/Tabs.tsx';
import Button from '@/components/ui/Button.tsx';
import { useForm, SubmitHandler, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserIcon, DownloadIcon, TrashIcon } from '@/components/Icons.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { api } from '@/services/api.ts';

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

const nullableInt = z.preprocess(
    (val) => (String(val).trim() === '' || (typeof val === 'number' && isNaN(val)) ? null : val),
    z.coerce.number().int().min(0).nullable().optional()
);

const nullableFloat = z.preprocess(
    (val) => (String(val).trim() === '' || (typeof val === 'number' && isNaN(val)) ? null : val),
    z.coerce.number().min(0).nullable().optional()
);

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
    hasBirthCertificate: z.boolean(),
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
    guardianIfNotParents: z.string().optional(),
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
    hasSponsorshipContract: z.boolean(),
    profilePhoto: z.any().optional().nullable()
});

export type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormProps {
    student: Student;
    onSave: (student: any) => void;
    onCancel: () => void;
    isSaving: boolean; // For create mode
    onEditSave: (updatedStudent: Student) => void; // For edit mode
}

const SECTION_FIELDS = {
    basic: ['studentId', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'profilePhoto', 'hasBirthCertificate'],
    program: ['studentStatus', 'sponsorshipStatus', 'sponsor', 'eepEnrollDate', 'outOfProgramDate', 'hasHousingSponsorship', 'hasSponsorshipContract', 'school', 'currentGrade'],
    family: ['guardianName', 'guardianContactInfo', 'guardianIfNotParents', 'siblingsCount', 'householdMembersCount', 'city', 'villageSlum', 'homeLocation', 'annualIncome', 'transportation', 'fatherDetails', 'motherDetails'],
    background: ['currentlyInSchool', 'previousSchooling', 'previousSchoolingDetails', 'gradeLevelBeforeEep', 'closestPrivateSchool', 'childResponsibilities', 'healthStatus', 'healthIssues', 'interactionWithOthers', 'interactionIssues'],
    narrative: ['parentSupportLevel', 'riskLevel', 'childStory', 'otherNotes'],
};

// --- NEW: DocumentUploadSection Component ---
interface DocumentUploadSectionProps {
    student: Student;
    docType: DocumentType;
    label: string;
    onUpdate: (updatedStudent: Student) => void;
}
const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({ student, docType, label, onUpdate }) => {
    const { showToast } = useNotification();
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const existingDocument = student.documents?.find(doc => doc.documentType === docType);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        try {
            const updatedStudent = await api.addStudentDocument(student.studentId, docType, selectedFile);
            showToast(`${label} uploaded successfully.`, 'success');
            onUpdate(updatedStudent);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
            showToast(error.message || `Failed to upload ${label}.`, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (docId: number) => {
        if (!window.confirm(`Are you sure you want to delete this ${label}?`)) return;
        setIsDeleting(true);
        try {
            const updatedStudent = await api.deleteStudentDocument(docId, student.studentId);
            showToast(`${label} deleted.`, 'success');
            onUpdate(updatedStudent);
        } catch (error: any) {
            showToast(error.message || `Failed to delete ${label}.`, 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="md:col-span-2 mt-2 p-3 bg-gray-2 dark:bg-box-dark-2 border border-stroke dark:border-strokedark rounded-lg">
            <label className="text-sm font-medium text-black dark:text-white">{label}</label>
            {existingDocument ? (
                <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-body-color dark:text-gray-300 truncate" title={existingDocument.originalFilename}>
                        File: {existingDocument.originalFilename}
                    </p>
                    <div className="flex items-center gap-2">
                        <a href={existingDocument.file} target="_blank" rel="noopener noreferrer" download>
                            <Button size="sm" variant="ghost" icon={<DownloadIcon className="w-4 h-4"/>}>Download</Button>
                        </a>
                        <Button size="sm" variant="danger" icon={<TrashIcon className="w-4 h-4"/>} onClick={() => handleDelete(existingDocument.id)} isLoading={isDeleting}>Delete</Button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 mt-2">
                    <FormInput
                        label=""
                        id={`doc-upload-${docType}`}
                        type="file"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="flex-grow"
                    />
                    {selectedFile && <Button size="sm" onClick={handleUpload} isLoading={isUploading}>Upload</Button>}
                </div>
            )}
        </div>
    );
};

// Define a truly default, empty state to prevent uncontrolled input warnings
const initialStudentFormData: any = {
    studentId: '', firstName: '', lastName: '', dateOfBirth: '', gender: Gender.MALE,
    school: '', currentGrade: '', eepEnrollDate: formatDateForInput(new Date().toISOString()) || '',
    outOfProgramDate: '', studentStatus: StudentStatus.ACTIVE, sponsorshipStatus: SponsorshipStatus.UNSPONSORED,
    hasHousingSponsorship: false, sponsor: '', hasBirthCertificate: false, siblingsCount: '',
    householdMembersCount: '', city: '', villageSlum: '', guardianName: '', guardianContactInfo: '',
    homeLocation: '', fatherDetails: { isLiving: YesNo.NA, isAtHome: YesNo.NA, isWorking: YesNo.NA, occupation: '', skills: '' },
    motherDetails: { isLiving: YesNo.NA, isAtHome: YesNo.NA, isWorking: YesNo.NA, occupation: '', skills: '' },
    annualIncome: '', guardianIfNotParents: '', parentSupportLevel: 3, closestPrivateSchool: '',
    currentlyInSchool: YesNo.NA, previousSchooling: YesNo.NA,
    previousSchoolingDetails: { when: '', howLong: '', where: '' }, gradeLevelBeforeEep: '',
    childResponsibilities: '', healthStatus: HealthStatus.GOOD, healthIssues: '',
    interactionWithOthers: InteractionStatus.GOOD, interactionIssues: '', childStory: '',
    otherNotes: '', riskLevel: 3, transportation: TransportationType.WALKING,
    hasSponsorshipContract: false, profilePhoto: null,
};


const StudentForm: React.FC<StudentFormProps> = ({ student, onSave, onCancel, isSaving, onEditSave }) => {
    const isEdit = !!student.studentId;
    const { sponsorLookup: sponsors } = useData();
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [savingSection, setSavingSection] = useState<string | null>(null);
    const { showToast } = useNotification();

    const { register, handleSubmit, formState: { errors }, watch, trigger, getValues, reset, setValue } = useForm<StudentFormData>({
        resolver: zodResolver(studentSchema) as Resolver<StudentFormData>,
        defaultValues: initialStudentFormData,
    });
    
    // This effect populates the form with data when editing an existing student or resets it for a new one.
    useEffect(() => {
        if (isEdit && student?.studentId) {
            const formValues = {
                ...initialStudentFormData,
                ...student,
                dateOfBirth: formatDateForInput(student.dateOfBirth),
                eepEnrollDate: formatDateForInput(student.eepEnrollDate),
                outOfProgramDate: formatDateForInput(student.outOfProgramDate),
                siblingsCount: student.siblingsCount ?? '',
                householdMembersCount: student.householdMembersCount ?? '',
                annualIncome: student.annualIncome ?? '',
            };
            reset(formValues);
            setPhotoPreview(student.profilePhoto || null);
        } else {
            reset(initialStudentFormData);
            setPhotoPreview(null);
        }
    }, [isEdit, student, reset]);
    
    const watchHasHousingSponsorship = watch('hasHousingSponsorship');
    const watchHasSponsorshipContract = watch('hasSponsorshipContract');
    const watchHasBirthCertificate = watch('hasBirthCertificate');
    const watchPreviousSchooling = watch('previousSchooling');

    const handleCreateSubmit: SubmitHandler<StudentFormData> = (data) => {
        const file = data.profilePhoto instanceof FileList ? data.profilePhoto[0] : undefined;
        onSave({ ...data, profilePhoto: file });
    };

    const handlePartialSave = async (sectionKey: keyof typeof SECTION_FIELDS) => {
        setSavingSection(sectionKey);
        const fieldsToValidate = SECTION_FIELDS[sectionKey] as (keyof StudentFormData)[];
        const isValid = await trigger(fieldsToValidate);

        if (!isValid) {
            showToast('Please fix the errors in this section before saving.', 'error');
            setSavingSection(null);
            return;
        }

        const allData = getValues();
        
        // --- Document Upload Confirmation Logic ---
        if (isEdit) {
            if (sectionKey === 'basic' && allData.hasBirthCertificate) {
                const hasCert = student.documents?.some(doc => doc.documentType === DocumentType.BIRTH_CERTIFICATE);
                if (!hasCert) {
                    if (!window.confirm("You've indicated the student has a birth certificate, but no document is uploaded. Do you want to save anyway?")) {
                        setSavingSection(null);
                        return;
                    }
                }
            }
            if (sectionKey === 'program' && allData.hasSponsorshipContract) {
                const hasContract = student.documents?.some(doc => doc.documentType === DocumentType.SPONSORSHIP_CONTRACT);
                if (!hasContract) {
                    if (!window.confirm("You've indicated the student has a sponsorship contract, but no document is uploaded. Do you want to save anyway?")) {
                        setSavingSection(null);
                        return;
                    }
                }
            }
        }
        // --- End Confirmation Logic ---

        const payload: Partial<StudentFormData> & { studentId: string } = { studentId: student.studentId };

        fieldsToValidate.forEach(field => {
            (payload as any)[field] = allData[field as keyof StudentFormData];
        });

        if (sectionKey === 'basic' && 'profilePhoto' in payload) {
            const photoValue = payload.profilePhoto;
            if (photoValue instanceof FileList && photoValue.length > 0) {
                payload.profilePhoto = photoValue[0];
            } else if (photoValue === null) {
                payload.profilePhoto = null;
            } else {
                delete payload.profilePhoto;
            }
        }

        try {
            const updatedStudent = await api.updateStudent(payload as any);
            showToast(`${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)} section updated!`, 'success');
            onEditSave(updatedStudent);
        } catch (error: any) {
            showToast(error.message || 'Failed to update section.', 'error');
        } finally {
            setSavingSection(null);
        }
    };

    const { onChange: onFormPhotoChange, ...photoRegisterProps } = register('profilePhoto');
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFormPhotoChange(e);
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPhotoPreview(student?.profilePhoto || null);
        }
    };

    const handleRemovePhoto = () => {
        setPhotoPreview(null);
        setValue('profilePhoto', null, { shouldDirty: true });
        const fileInput = document.getElementById('profilePhoto') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const SectionSaveButton: React.FC<{section: keyof typeof SECTION_FIELDS, children: React.ReactNode}> = ({ section, children }) => (
        isEdit ? (
            <div className="md:col-span-2 flex justify-end mt-4">
                <Button type="button" onClick={() => handlePartialSave(section)} isLoading={savingSection === section} size="sm">
                    {children}
                </Button>
            </div>
        ) : null
    );

    const ProgramDetails = (
        <FormSection title="Program Details">
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
            <FormInput label="EEP Enroll Date" id="eepEnrollDate" type="date" {...register('eepEnrollDate')} error={errors.eepEnrollDate?.message} />
            <FormInput label="Out of Program Date" id="outOfProgramDate" type="date" {...register('outOfProgramDate')} error={errors.outOfProgramDate?.message} />
            <FormInput label="School" id="school" {...register('school')} error={errors.school?.message} />
            <FormInput label="Current Grade" id="currentGrade" {...register('currentGrade')} error={errors.currentGrade?.message} />
            <FormCheckbox label="Has Housing Sponsorship?" id="hasHousingSponsorship" {...register('hasHousingSponsorship')} checked={watchHasHousingSponsorship} />
            <div className="md:col-span-2">
                <FormCheckbox label="Has Sponsorship Contract?" id="hasSponsorshipContract" {...register('hasSponsorshipContract')} checked={watchHasSponsorshipContract} />
                 {isEdit && watchHasSponsorshipContract && (
                    <DocumentUploadSection 
                        student={student} 
                        docType={DocumentType.SPONSORSHIP_CONTRACT} 
                        label="Sponsorship Contract" 
                        onUpdate={onEditSave}
                    />
                )}
            </div>
            <SectionSaveButton section="program">Save Program Details</SectionSaveButton>
        </FormSection>
    );

    const FamilyAndHousehold = (
        <div className="space-y-4">
            <FormSection title="Household & Location">
                <FormInput label="Guardian Name" id="guardianName" {...register('guardianName')} error={errors.guardianName?.message} />
                <FormInput label="Guardian Contact Info" id="guardianContactInfo" {...register('guardianContactInfo')} error={errors.guardianContactInfo?.message} />
                <FormInput label="Guardian (if not parents)" id="guardianIfNotParents" {...register('guardianIfNotParents')} error={errors.guardianIfNotParents?.message} />
                <FormInput label="Number of Siblings" id="siblingsCount" type="number" {...register('siblingsCount')} error={errors.siblingsCount?.message} />
                <FormInput label="Household Members" id="householdMembersCount" type="number" {...register('householdMembersCount')} error={errors.householdMembersCount?.message} />
                <FormInput label="City" id="city" {...register('city')} error={errors.city?.message} />
                <FormInput label="Village/Slum" id="villageSlum" {...register('villageSlum')} error={errors.villageSlum?.message} />
                <FormInput label="Home Location" id="homeLocation" {...register('homeLocation')} error={errors.homeLocation?.message} />
                <FormInput label="Annual Income" id="annualIncome" type="number" {...register('annualIncome')} error={errors.annualIncome?.message} />
                 <FormSelect label="Transportation" id="transportation" {...register('transportation')} error={errors.transportation?.message} >
                    {Object.values(TransportationType).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
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
            <SectionSaveButton section="family">Save Family & Household</SectionSaveButton>
        </div>
    );
    
     const BackgroundAndHealth = (
        <div className="space-y-4">
             <FormSection title="Educational Background">
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
                <FormTextArea label="Child's Responsibilities" id="childResponsibilities" className="md:col-span-2" {...register('childResponsibilities')} error={errors.childResponsibilities?.message} />
             </FormSection>
             <FormSection title="Health & Social">
                <FormSelect label="Health Status" id="healthStatus" {...register('healthStatus')} error={errors.healthStatus?.message} >
                    {Object.values(HealthStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormTextArea label="Health Issues/Details" id="healthIssues" {...register('healthIssues')} error={errors.healthIssues?.message} />
                <FormSelect label="Interaction with Others" id="interactionWithOthers" {...register('interactionWithOthers')} error={errors.interactionWithOthers?.message} >
                    {Object.values(InteractionStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormTextArea label="Interaction Issues" id="interactionIssues" {...register('interactionIssues')} error={errors.interactionIssues?.message} />
            </FormSection>
            <SectionSaveButton section="background">Save Background & Health</SectionSaveButton>
        </div>
    );

     const NarrativeAndRisk = (
        <div className="space-y-4">
             <FormSection title="Narrative & Risk Assessment">
                 <FormInput label="Parental Support Level (1-5)" id="parentSupportLevel" type="number" min="1" max="5" {...register('parentSupportLevel')} error={errors.parentSupportLevel?.message} />
                <FormInput label="Risk Level (1-5)" id="riskLevel" type="number" min="1" max="5" {...register('riskLevel')} error={errors.riskLevel?.message} />
                <FormTextArea label="Child's Story" id="childStory" className="md:col-span-2" {...register('childStory')} error={errors.childStory?.message} />
                <FormTextArea label="Other Notes" id="otherNotes" className="md:col-span-2" {...register('otherNotes')} error={errors.otherNotes?.message} />
            </FormSection>
            <SectionSaveButton section="narrative">Save Narrative & Risk</SectionSaveButton>
        </div>
    );


    const tabs: Tab[] = [
        { id: 'program', label: 'Program Details', content: ProgramDetails },
        { id: 'family', label: 'Family & Household', content: FamilyAndHousehold },
        { id: 'background', label: 'Background & Health', content: BackgroundAndHealth },
        { id: 'narrative', label: 'Narrative & Risk', content: NarrativeAndRisk },
    ];
    
    return (
        <form onSubmit={!isEdit ? handleSubmit(handleCreateSubmit) : (e) => e.preventDefault()}>
            <div className="p-4 space-y-4">
                <FormSection title="Basic Information" useDefaultGrid={false}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {/* Photo Column */}
                        <div className="md:col-span-1 flex flex-col items-center gap-2">
                            <label className="text-black dark:text-white mb-2">Profile Photo</label>
                            {photoPreview ? (
                                <img src={photoPreview} alt="Profile Preview" className="w-32 h-32 rounded-full object-cover" />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center">
                                    <UserIcon className="w-16 h-16 text-gray-500" />
                                </div>
                            )}
                            <FormInput
                                label=""
                                id="profilePhoto"
                                type="file"
                                accept="image/*"
                                {...photoRegisterProps}
                                onChange={handlePhotoChange}
                                error={errors.profilePhoto?.message}
                                className="w-full"
                            />
                            {photoPreview && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemovePhoto}
                                    className="text-danger w-full"
                                >
                                    Remove Photo
                                </Button>
                            )}
                        </div>

                        {/* Fields Column */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Student ID" id="studentId" {...register('studentId')} disabled={isEdit} error={errors.studentId?.message} className="md:col-span-2" />
                            <FormInput label="First Name" id="firstName" {...register('firstName')} error={errors.firstName?.message} />
                            <FormInput label="Last Name" id="lastName" {...register('lastName')} error={errors.lastName?.message} />
                            <FormInput label="Date of Birth" id="dateOfBirth" type="date" {...register('dateOfBirth')} error={errors.dateOfBirth?.message} />
                            <FormSelect label="Gender" id="gender" {...register('gender')} error={errors.gender?.message}>
                                {Object.values(Gender).map((g: string) => <option key={g} value={g}>{g}</option>)}
                            </FormSelect>
                            <div className="md:col-span-2 flex items-center pt-2">
                                <FormCheckbox label="Has Birth Certificate?" id="hasBirthCertificate" {...register('hasBirthCertificate')} checked={watchHasBirthCertificate} />
                            </div>
                            {isEdit && watchHasBirthCertificate && (
                                <DocumentUploadSection 
                                    student={student} 
                                    docType={DocumentType.BIRTH_CERTIFICATE} 
                                    label="Birth Certificate" 
                                    onUpdate={onEditSave}
                                />
                            )}
                        </div>
                    </div>
                    {isEdit && (
                        <div className="flex justify-end mt-4">
                            <Button type="button" onClick={() => handlePartialSave('basic')} isLoading={savingSection === 'basic'} size="sm">
                                Save Basic Info
                            </Button>
                        </div>
                    )}
                </FormSection>
                <Tabs tabs={tabs} />
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t border-stroke dark:border-strokedark">
                {isEdit ? (
                    <Button type="button" variant="ghost" onClick={onCancel}>Close</Button>
                ) : (
                    <>
                        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                        <Button type="submit" isLoading={isSaving}>Save Student</Button>
                    </>
                )}
            </div>
        </form>
    );
};
export default StudentForm;