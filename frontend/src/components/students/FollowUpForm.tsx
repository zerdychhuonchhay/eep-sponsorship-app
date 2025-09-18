import React, { useEffect } from 'react';
import { Student, FollowUpRecord, WellbeingStatus, YesNo, RISK_FACTORS } from '@/types.ts';
import { FormInput, FormTextArea, FormSection, FormSubSection, YesNoNASelect, WellbeingSelect } from '@/components/forms/FormControls.tsx';
import { calculateAge } from '@/utils/dateUtils.ts';
import Button from '@/components/ui/Button.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formatDateForInput = (dateStr?: string) => {
    if (!dateStr || isNaN(new Date(dateStr).getTime())) return '';
    return new Date(dateStr).toISOString().split('T')[0];
};

const followUpSchema = z.object({
    dateOfFollowUp: z.string().min(1, 'Date of follow-up is required'),
    location: z.string().min(1, 'Location is required'),
    parentGuardian: z.string().optional(),
    physicalHealth: z.nativeEnum(WellbeingStatus),
    physicalHealthNotes: z.string().optional(),
    socialInteraction: z.nativeEnum(WellbeingStatus),
    socialInteractionNotes: z.string().optional(),
    homeLife: z.nativeEnum(WellbeingStatus),
    homeLifeNotes: z.string().optional(),
    drugsAlcoholViolence: z.nativeEnum(YesNo),
    drugsAlcoholViolenceNotes: z.string().optional(),
    riskFactorsList: z.array(z.string()),
    riskFactorsDetails: z.string().optional(),
    conditionOfHome: z.nativeEnum(WellbeingStatus),
    conditionOfHomeNotes: z.string().optional(),
    motherWorking: z.nativeEnum(YesNo),
    fatherWorking: z.nativeEnum(YesNo),
    otherFamilyMemberWorking: z.nativeEnum(YesNo),
    currentWorkDetails: z.string().optional(),
    attendingChurch: z.nativeEnum(YesNo),
    staffNotes: z.string().optional(),
    changesRecommendations: z.string().optional(),
    childProtectionConcerns: z.nativeEnum(YesNo),
    humanTraffickingRisk: z.nativeEnum(YesNo),
    completedBy: z.string().min(1, 'Completed By is required'),
    dateCompleted: z.string().min(1, 'Date Completed is required'),
    reviewedBy: z.string().optional(),
    dateReviewed: z.string().optional().nullable(),
});

type FollowUpFormData = z.infer<typeof followUpSchema>;

interface FollowUpFormProps {
    student: Student;
    onSave: (record: any) => void;
    onCancel: () => void;
    initialData?: FollowUpRecord | null;
    isSaving: boolean;
}

const FollowUpForm: React.FC<FollowUpFormProps> = ({ student, onSave, onCancel, initialData, isSaving: isApiSaving }) => {
    const isEdit = !!initialData;

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<FollowUpFormData>({
        resolver: zodResolver(followUpSchema),
        defaultValues: {
            dateOfFollowUp: formatDateForInput(new Date().toISOString()),
            location: '', parentGuardian: student.guardianName, physicalHealth: WellbeingStatus.NA,
            physicalHealthNotes: '', socialInteraction: WellbeingStatus.NA, socialInteractionNotes: '',
            homeLife: WellbeingStatus.NA, homeLifeNotes: '', drugsAlcoholViolence: YesNo.NA,
            drugsAlcoholViolenceNotes: '', riskFactorsList: [], riskFactorsDetails: '',
            conditionOfHome: WellbeingStatus.NA, conditionOfHomeNotes: '', motherWorking: YesNo.NA,
            fatherWorking: YesNo.NA, otherFamilyMemberWorking: YesNo.NA, currentWorkDetails: '',
            attendingChurch: YesNo.NA, staffNotes: '', changesRecommendations: '',
            childProtectionConcerns: YesNo.NA, humanTraffickingRisk: YesNo.NA, completedBy: '',
            dateCompleted: formatDateForInput(new Date().toISOString()), reviewedBy: '', dateReviewed: '',
        }
    });

    useEffect(() => {
        if (isEdit && initialData) {
            reset({
                ...initialData,
                dateOfFollowUp: formatDateForInput(initialData.dateOfFollowUp),
                dateCompleted: formatDateForInput(initialData.dateCompleted),
                dateReviewed: formatDateForInput(initialData.dateReviewed),
            });
        }
    }, [isEdit, initialData, reset]);

    const watchedFields = watch(['physicalHealth', 'socialInteraction', 'homeLife', 'drugsAlcoholViolence', 'conditionOfHome']);
    const isFormSubmitting = isSubmitting || isApiSaving;

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <FormSection title="Section 1: Client Information">
                 <div>
                    <label className="mb-2 block text-black dark:text-white">Child's Name</label>
                    <p className="w-full rounded-lg border-[1.5px] border-stroke bg-gray-2 dark:border-strokedark dark:bg-form-input py-3 px-5 font-medium text-black dark:text-white">{student.firstName} {student.lastName}</p>
                </div>
                <div>
                    <label className="mb-2 block text-black dark:text-white">Child's Current Age</label>
                    <p className="w-full rounded-lg border-[1.5px] border-stroke bg-gray-2 dark:border-strokedark dark:bg-form-input py-3 px-5 font-medium text-black dark:text-white">{calculateAge(student.dateOfBirth)}</p>
                </div>
                <FormInput label="Date of Follow Up" id="dateOfFollowUp" type="date" {...register('dateOfFollowUp')} error={errors.dateOfFollowUp?.message} />
                <FormInput label="Location" id="location" {...register('location')} error={errors.location?.message} />
                <FormInput label="Parent/Guardian" id="parentGuardian" {...register('parentGuardian')} />
            </FormSection>

            <FormSection title="Section 2: Well-being Progress">
                <FormSubSection title="Well-being">
                    <WellbeingSelect label="Physical Health" id="physicalHealth" {...register('physicalHealth')} />
                    {(watchedFields[0] === WellbeingStatus.AVERAGE || watchedFields[0] === WellbeingStatus.POOR) && <FormTextArea label="Notes" id="physicalHealthNotes" {...register('physicalHealthNotes')} />}
                    <WellbeingSelect label="Social Interaction" id="socialInteraction" {...register('socialInteraction')} />
                    {(watchedFields[1] === WellbeingStatus.AVERAGE || watchedFields[1] === WellbeingStatus.POOR) && <FormTextArea label="Notes" id="socialInteractionNotes" {...register('socialInteractionNotes')} />}
                    <WellbeingSelect label="Home Life" id="homeLife" {...register('homeLife')} />
                    {(watchedFields[2] === WellbeingStatus.AVERAGE || watchedFields[2] === WellbeingStatus.POOR) && <FormTextArea label="Notes" id="homeLifeNotes" {...register('homeLifeNotes')} />}
                    <YesNoNASelect label="Drugs/Alcohol/Violence" id="drugsAlcoholViolence" {...register('drugsAlcoholViolence')} />
                    {watchedFields[3] === YesNo.YES && <FormTextArea label="Notes" id="drugsAlcoholViolenceNotes" {...register('drugsAlcoholViolenceNotes')} />}
                </FormSubSection>
            </FormSection>
            
            <FormSection title="Section 2a: Risk Factors">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">Current Risk Factors (Select all that apply)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-2 dark:bg-box-dark-2 rounded-lg">
                        {RISK_FACTORS.map(risk => (
                            <label key={risk} className="flex items-center space-x-2 text-sm text-black dark:text-white">
                                <input type="checkbox" value={risk} {...register('riskFactorsList')} className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                                <span>{risk}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <FormTextArea label="Details for selections above" id="riskFactorsDetails" {...register('riskFactorsDetails')} className="md:col-span-2" />
                 <WellbeingSelect label="Condition of Home" id="conditionOfHome" {...register('conditionOfHome')} />
                 {(watchedFields[4] === WellbeingStatus.AVERAGE || watchedFields[4] === WellbeingStatus.POOR) && <FormTextArea label="Notes" id="conditionOfHomeNotes" {...register('conditionOfHomeNotes')} />}
                 <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <YesNoNASelect label="Mother Working?" id="motherWorking" {...register('motherWorking')} />
                    <YesNoNASelect label="Father Working?" id="fatherWorking" {...register('fatherWorking')} />
                    <YesNoNASelect label="Other Family Member Working?" id="otherFamilyMemberWorking" {...register('otherFamilyMemberWorking')} />
                 </div>
                 <FormTextArea label="Current Work Details" id="currentWorkDetails" {...register('currentWorkDetails')} className="md:col-span-2" />
                 <YesNoNASelect label="Attending Church/House of Prayer?" id="attendingChurch" {...register('attendingChurch')} />
            </FormSection>

            <FormSection title="Section 4: EEP Staff Notes">
                <FormTextArea label="Notes" id="staffNotes" {...register('staffNotes')} className="md:col-span-2" />
                <FormTextArea label="Changes/Recommendations" id="changesRecommendations" {...register('changesRecommendations')} className="md:col-span-2" />
            </FormSection>

            <FormSection title="Section 5: Conclusion">
                <YesNoNASelect label="Child Protection Concerns?" id="childProtectionConcerns" {...register('childProtectionConcerns')} />
                <YesNoNASelect label="Increased Human Trafficking Risk?" id="humanTraffickingRisk" {...register('humanTraffickingRisk')} />
            </FormSection>

            <FormSection title="Completion Details">
                <FormInput label="Completed By" id="completedBy" {...register('completedBy')} error={errors.completedBy?.message} />
                <FormInput label="Date Completed" id="dateCompleted" type="date" {...register('dateCompleted')} error={errors.dateCompleted?.message} />
            </FormSection>

            <FormSection title="Administrator Review">
                <p className="md:col-span-2 text-sm text-body-color dark:text-gray-400">This section is to be completed by an administrator upon review.</p>
                <FormInput label="Reviewed By" id="reviewedBy" {...register('reviewedBy')} />
                <FormInput label="Date Reviewed" id="dateReviewed" type="date" {...register('dateReviewed')} />
            </FormSection>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isFormSubmitting}>Cancel</Button>
                <Button type="submit" isLoading={isFormSubmitting}>{isEdit ? 'Update Record' : 'Save Record'}</Button>
            </div>
        </form>
    );
};
export default FollowUpForm;