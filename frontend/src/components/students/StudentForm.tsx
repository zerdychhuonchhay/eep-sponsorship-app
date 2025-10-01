import React, { useState, useEffect } from 'react';
import { Student, Gender, StudentStatus, YesNo, HealthStatus, InteractionStatus, TransportationType, PrimaryCaregiver } from '@/types.ts';
import { FormInput, FormSelect, FormTextArea, FormCheckbox, FormSection, FormSubSection, YesNoNASelect } from '@/components/forms/FormControls.tsx';
import Tabs, { Tab } from '@/components/ui/Tabs.tsx';
import Button from '@/components/ui/Button.tsx';
import { useForm, SubmitHandler, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentSchema, StudentFormData } from '@/components/schemas/studentSchema.ts';
import { UserIcon, ArrowUpIcon, ArrowDownIcon } from '@/components/Icons.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { api } from '@/services/api.ts';
import useMediaQuery from '@/hooks/useMediaQuery.ts';
import Stepper from '@/components/ui/Stepper.tsx';

const formatDateForInput = (dateStr?: string | null) => {
    if (!dateStr || isNaN(new Date(dateStr).getTime())) return '';
    return new Date(dateStr).toISOString().split('T')[0];
};

interface StudentFormProps {
    student: Student;
    onSave: (student: any) => void;
    onCancel: () => void;
    isSaving: boolean;
    onEditSave: (updatedStudent: Student) => void;
}

const SECTION_FIELDS = {
    basic: ['studentId', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'profilePhoto'],
    program: ['studentStatus', 'eepEnrollDate', 'outOfProgramDate', 'hasHousingSponsorship', 'school', 'currentGrade'],
    family: ['primaryCaregiver', 'guardianName', 'guardianContactInfo', 'guardianRelationship', 'siblingsCount', 'householdMembersCount', 'city', 'villageSlum', 'homeLocation', 'annualIncome', 'transportation', 'fatherDetails', 'motherDetails'],
    background: ['currentlyInSchool', 'previousSchooling', 'previousSchoolingDetails', 'gradeLevelBeforeEep', 'closestPrivateSchool', 'childResponsibilities', 'healthStatus', 'healthIssues', 'interactionWithOthers', 'interactionIssues'],
    narrative: ['parentSupportLevel', 'riskLevel', 'childStory', 'otherNotes'],
};

const initialStudentFormData: StudentFormData = {
    studentId: '', firstName: '', lastName: '', dateOfBirth: '', gender: Gender.MALE,
    school: '', currentGrade: '', eepEnrollDate: formatDateForInput(new Date().toISOString()) || '',
    outOfProgramDate: '', studentStatus: StudentStatus.ACTIVE,
    hasHousingSponsorship: false, siblingsCount: null,
    householdMembersCount: null, city: '', villageSlum: '', guardianName: '', guardianContactInfo: '',
    homeLocation: '', fatherDetails: { isLiving: YesNo.NA, isAtHome: YesNo.NA, isWorking: YesNo.NA, occupation: '', skills: '' },
    motherDetails: { isLiving: YesNo.NA, isAtHome: YesNo.NA, isWorking: YesNo.NA, occupation: '', skills: '' },
    annualIncome: null,
    primaryCaregiver: PrimaryCaregiver.MOTHER_FATHER,
    guardianRelationship: '',
    parentSupportLevel: 3, closestPrivateSchool: '',
    currentlyInSchool: YesNo.NA, previousSchooling: YesNo.NA,
    previousSchoolingDetails: { when: '', howLong: '', where: '' }, gradeLevelBeforeEep: '',
    childResponsibilities: '', healthStatus: HealthStatus.GOOD, healthIssues: '',
    interactionWithOthers: InteractionStatus.GOOD, interactionIssues: '', childStory: '',
    otherNotes: '', riskLevel: 3, transportation: TransportationType.WALKING,
    profilePhoto: null,
};


const StudentForm: React.FC<StudentFormProps> = ({ student, onSave, onCancel, isSaving, onEditSave }) => {
    const isEdit = !!student.studentId;
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [savingSection, setSavingSection] = useState<string | null>(null);
    const { showToast } = useNotification();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [activeStep, setActiveStep] = useState(0);

    const { register, handleSubmit, formState: { errors }, watch, trigger, getValues, reset, setValue } = useForm<StudentFormData>({
        resolver: zodResolver(studentSchema) as Resolver<StudentFormData>,
        defaultValues: initialStudentFormData,
    });
    
    useEffect(() => {
        if (isEdit && student?.studentId) {
            const formValues: StudentFormData = {
                ...initialStudentFormData,
                ...student,
                dateOfBirth: formatDateForInput(student.dateOfBirth),
                eepEnrollDate: formatDateForInput(student.eepEnrollDate),
                outOfProgramDate: formatDateForInput(student.outOfProgramDate),
                siblingsCount: student.siblingsCount ?? null,
                householdMembersCount: student.householdMembersCount ?? null,
                annualIncome: student.annualIncome ?? null,
                primaryCaregiver: student.guardianIfNotParents ? PrimaryCaregiver.OTHER : PrimaryCaregiver.MOTHER_FATHER,
                guardianRelationship: student.guardianIfNotParents || '',
            };
            reset(formValues);
            setPhotoPreview(student.profilePhoto || null);
        } else {
            reset(initialStudentFormData);
            setPhotoPreview(null);
        }
    }, [isEdit, student, reset]);
    
    const watchHasHousingSponsorship = watch('hasHousingSponsorship');
    const watchPreviousSchooling = watch('previousSchooling');
    const watchPrimaryCaregiver = watch('primaryCaregiver');
    const [isParentDetailsExpanded, setIsParentDetailsExpanded] = useState(true);

    useEffect(() => {
        switch (watchPrimaryCaregiver) {
            case PrimaryCaregiver.MOTHER_FATHER:
                setValue('fatherDetails.isLiving', YesNo.YES);
                setValue('motherDetails.isLiving', YesNo.YES);
                break;
            case PrimaryCaregiver.MOTHER:
                setValue('motherDetails.isLiving', YesNo.YES);
                break;
            case PrimaryCaregiver.FATHER:
                setValue('fatherDetails.isLiving', YesNo.YES);
                break;
            default:
                break;
        }
        // Collapse by default if the caregiver is not a parent, otherwise expand.
        setIsParentDetailsExpanded(watchPrimaryCaregiver !== PrimaryCaregiver.OTHER);
    }, [watchPrimaryCaregiver, setValue]);

    const transformDataForSave = (data: any) => {
        const payload = { ...data };
        if (payload.primaryCaregiver === PrimaryCaregiver.OTHER) {
            payload.guardianIfNotParents = payload.guardianRelationship || '';
        } else {
            payload.guardianIfNotParents = '';
        }
        delete payload.primaryCaregiver;
        delete payload.guardianRelationship;
        return payload;
    };

    const handleCreateSubmit: SubmitHandler<StudentFormData> = (data) => {
        const file = (data as any).profilePhoto instanceof FileList ? (data as any).profilePhoto[0] : undefined;
        const payload = transformDataForSave(data);
        onSave({ ...payload, profilePhoto: file });
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
        let payload: Partial<StudentFormData> & { studentId: string } = { studentId: student.studentId };

        fieldsToValidate.forEach(field => {
            (payload as any)[field] = allData[field as keyof StudentFormData];
        });

        if (sectionKey === 'family') {
            payload = transformDataForSave(payload);
        }

        if (sectionKey === 'basic' && 'profilePhoto' in payload) {
            const photoValue = (payload as any).profilePhoto;
            if (photoValue instanceof FileList && photoValue.length > 0) {
                (payload as any).profilePhoto = photoValue[0];
            } else if (photoValue === null) {
                (payload as any).profilePhoto = null;
            } else {
                delete (payload as any).profilePhoto;
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

    const steps = [
        { label: 'Program' },
        { label: 'Family' },
        { label: 'Background' },
        { label: 'Narrative' },
    ];
    
    const handleNextStep = async () => {
        const sections = ['program', 'family', 'background', 'narrative'];
        const currentSection = sections[activeStep] as keyof typeof SECTION_FIELDS;
        const fieldsToValidate = SECTION_FIELDS[currentSection];
        
        const isValid = await trigger(fieldsToValidate as (keyof StudentFormData)[]);
        if (isValid) {
            setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
        } else {
            showToast('Please fix the errors before proceeding.', 'error');
        }
    };

    const handlePrevStep = () => {
        setActiveStep(prev => Math.max(prev - 1, 0));
    };

    const ProgramDetails = (
        <FormSection title="Program Details">
            <FormSelect label="Status" id="studentStatus" {...register('studentStatus')} error={errors.studentStatus?.message}>
                {Object.values(StudentStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
            </FormSelect>
            <FormInput label="EEP Enroll Date" id="eepEnrollDate" type="date" {...register('eepEnrollDate')} error={errors.eepEnrollDate?.message} />
            <FormInput label="Out of Program Date" id="outOfProgramDate" type="date" {...register('outOfProgramDate')} error={errors.outOfProgramDate?.message} />
            <FormInput label="School" id="school" {...register('school')} error={errors.school?.message} />
            <FormInput label="Current Grade" id="currentGrade" {...register('currentGrade')} error={errors.currentGrade?.message} />
            <div className="md:col-span-2">
                <FormCheckbox label="Has Housing Sponsorship?" id="hasHousingSponsorship" {...register('hasHousingSponsorship')} checked={watchHasHousingSponsorship} />
            </div>
            <SectionSaveButton section="program">Save Program Details</SectionSaveButton>
        </FormSection>
    );

    const FamilyAndHousehold = (
        <div className="space-y-4">
            <FormSection title="Primary Caregiver">
                <div className="md:col-span-2">
                    <FormSelect label="Who is the child's primary caregiver?" id="primaryCaregiver" {...register('primaryCaregiver')} error={errors.primaryCaregiver?.message}>
                        {Object.values(PrimaryCaregiver).map((s: string) => <option key={s} value={s}>{s}</option>)}
                    </FormSelect>
                </div>
                <FormInput 
                    label={watchPrimaryCaregiver === PrimaryCaregiver.OTHER ? "Guardian's Name" : "Primary Contact Name"} 
                    id="guardianName" 
                    {...register('guardianName')} 
                    error={errors.guardianName?.message} 
                />
                <FormInput 
                    label={watchPrimaryCaregiver === PrimaryCaregiver.OTHER ? "Guardian's Contact Info" : "Primary Contact Info"} 
                    id="guardianContactInfo" 
                    {...register('guardianContactInfo')} 
                    error={errors.guardianContactInfo?.message} 
                />
                {watchPrimaryCaregiver === PrimaryCaregiver.OTHER && (
                    <FormInput label="Relationship to Child" id="guardianRelationship" {...register('guardianRelationship')} error={errors.guardianRelationship?.message} />
                )}
                <p className="md:col-span-2 text-xs text-body-color dark:text-gray-400 mt-1">
                    The primary contact will be used for all general communications.
                </p>
            </FormSection>
             
            <FormSection title="Living Situation">
                <FormInput label="City" id="city" {...register('city')} error={errors.city?.message} />
                <FormInput label="Village/Slum" id="villageSlum" {...register('villageSlum')} error={errors.villageSlum?.message} />
                <FormInput label="Home Location" id="homeLocation" {...register('homeLocation')} error={errors.homeLocation?.message} className="md:col-span-2" />
                <FormInput label="Number of Siblings" id="siblingsCount" type="number" {...register('siblingsCount')} error={errors.siblingsCount?.message} />
                <FormInput label="Household Members" id="householdMembersCount" type="number" {...register('householdMembersCount')} error={errors.householdMembersCount?.message} />
                <FormInput label="Annual Income" id="annualIncome" type="number" {...register('annualIncome')} error={errors.annualIncome?.message} />
                <FormSelect label="Transportation" id="transportation" {...register('transportation')} error={errors.transportation?.message} >
                    {Object.values(TransportationType).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
            </FormSection>

            <div className="rounded-sm border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-box-dark">
                <div 
                    className="border-b border-stroke py-2 px-4 dark:border-strokedark flex justify-between items-center cursor-pointer"
                    onClick={() => setIsParentDetailsExpanded(!isParentDetailsExpanded)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsParentDetailsExpanded(!isParentDetailsExpanded); }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isParentDetailsExpanded}
                >
                    <h3 className="font-medium text-black dark:text-white">
                        {watchPrimaryCaregiver === PrimaryCaregiver.OTHER ? "Biological Parent Details" : "Parents/Guardians"}
                    </h3>
                    {isParentDetailsExpanded ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                </div>
                {isParentDetailsExpanded && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                )}
            </div>
            
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

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Student ID" id="studentId" {...register('studentId')} disabled={isEdit} error={errors.studentId?.message} className="md:col-span-2" />
                            <FormInput label="First Name" id="firstName" {...register('firstName')} error={errors.firstName?.message} />
                            <FormInput label="Last Name" id="lastName" {...register('lastName')} error={errors.lastName?.message} />
                            <FormInput label="Date of Birth" id="dateOfBirth" type="date" {...register('dateOfBirth')} error={errors.dateOfBirth?.message} />
                            <FormSelect label="Gender" id="gender" {...register('gender')} error={errors.gender?.message}>
                                {Object.values(Gender).map((g: string) => <option key={g} value={g}>{g}</option>)}
                            </FormSelect>
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
                {isMobile && !isEdit ? (
                    <div className="space-y-4">
                        <Stepper steps={steps} activeStep={activeStep} className="mb-6" />
                        <div className={activeStep === 0 ? 'block' : 'hidden'}>{ProgramDetails}</div>
                        <div className={activeStep === 1 ? 'block' : 'hidden'}>{FamilyAndHousehold}</div>
                        <div className={activeStep === 2 ? 'block' : 'hidden'}>{BackgroundAndHealth}</div>
                        <div className={activeStep === 3 ? 'block' : 'hidden'}>{NarrativeAndRisk}</div>
                    </div>
                ) : (
                    <Tabs tabs={tabs} />
                )}
            </div>
            <div className="flex justify-end items-center gap-2 p-4 border-t border-stroke dark:border-strokedark">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    {isEdit ? 'Close' : 'Cancel'}
                </Button>
                
                {!isEdit && (
                    isMobile ? (
                        <>
                            {activeStep > 0 && (
                                <Button type="button" variant="ghost" onClick={handlePrevStep} disabled={isSaving}>
                                    Back
                                </Button>
                            )}
                            {activeStep < steps.length - 1 ? (
                                <Button type="button" onClick={handleNextStep}>
                                    Next
                                </Button>
                            ) : (
                                <Button type="submit" isLoading={isSaving}>
                                    Save Student
                                </Button>
                            )}
                        </>
                    ) : (
                        <Button type="submit" isLoading={isSaving}>
                            Save Student
                        </Button>
                    )
                )}
            </div>
        </form>
    );
};
export default StudentForm;
