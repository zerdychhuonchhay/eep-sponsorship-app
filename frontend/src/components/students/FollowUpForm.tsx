import React, { useState } from 'react';
import { Student, FollowUpRecord, WellbeingStatus, YesNo, RISK_FACTORS } from '@/types.ts';
import { FormInput, FormTextArea, FormSection, FormSubSection, YesNoNASelect, WellbeingSelect } from '@/components/forms/FormControls.tsx';
import { calculateAge } from '@/pages/StudentsPage.tsx';
import Button from '@/components/ui/Button.tsx';

interface FollowUpFormProps {
    student: Student;
    onSave: (record: any) => void;
    onCancel: () => void;
    initialData?: FollowUpRecord | null;
    isSaving: boolean;
}

const formatDateForInput = (dateStr?: string) => {
    if (!dateStr || isNaN(new Date(dateStr).getTime())) return '';
    return new Date(dateStr).toISOString().split('T')[0];
};

const FollowUpForm: React.FC<FollowUpFormProps> = ({ student, onSave, onCancel, initialData, isSaving }) => {
    const isEdit = !!initialData;
    const [formData, setFormData] = useState<Omit<FollowUpRecord, 'id' | 'studentId'>>(() => {
        const defaults = {
            childName: `${student.firstName} ${student.lastName}`,
            childCurrentAge: calculateAge(student.dateOfBirth) as number,
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
        };
        if (isEdit && initialData) {
            return {
                ...defaults, ...initialData,
                dateOfFollowUp: formatDateForInput(initialData.dateOfFollowUp),
                dateCompleted: formatDateForInput(initialData.dateCompleted),
                dateReviewed: formatDateForInput(initialData.dateReviewed),
            }
        }
        return defaults;
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRiskToggle = (risk: string) => {
        setFormData(prev => {
            const currentRisks = prev.riskFactorsList;
            return currentRisks.includes(risk)
                ? { ...prev, riskFactorsList: currentRisks.filter(r => r !== risk) }
                : { ...prev, riskFactorsList: [...currentRisks, risk] };
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormSection title="Section 1: Client Information">
                <FormInput label="Child's Name" id="childName" name="childName" value={formData.childName} onChange={handleChange} disabled />
                <FormInput label="Child's Current Age" id="childCurrentAge" name="childCurrentAge" type="number" value={formData.childCurrentAge} onChange={handleChange} disabled />
                <FormInput label="Date of Follow Up" id="dateOfFollowUp" name="dateOfFollowUp" type="date" value={formData.dateOfFollowUp} onChange={handleChange} required />
                <FormInput label="Location" id="location" name="location" value={formData.location} onChange={handleChange} required />
                <FormInput label="Parent/Guardian" id="parentGuardian" name="parentGuardian" value={formData.parentGuardian} onChange={handleChange} />
            </FormSection>

            <FormSection title="Section 2: Well-being Progress">
                <FormSubSection title="Well-being">
                    <WellbeingSelect label="Physical Health" id="physicalHealth" name="physicalHealth" value={formData.physicalHealth} onChange={handleChange} />
                    {(formData.physicalHealth === WellbeingStatus.AVERAGE || formData.physicalHealth === WellbeingStatus.POOR) && <FormTextArea label="Notes" id="physicalHealthNotes" name="physicalHealthNotes" value={formData.physicalHealthNotes} onChange={handleChange} />}
                    <WellbeingSelect label="Social Interaction" id="socialInteraction" name="socialInteraction" value={formData.socialInteraction} onChange={handleChange} />
                    {(formData.socialInteraction === WellbeingStatus.AVERAGE || formData.socialInteraction === WellbeingStatus.POOR) && <FormTextArea label="Notes" id="socialInteractionNotes" name="socialInteractionNotes" value={formData.socialInteractionNotes} onChange={handleChange} />}
                    <WellbeingSelect label="Home Life" id="homeLife" name="homeLife" value={formData.homeLife} onChange={handleChange} />
                    {(formData.homeLife === WellbeingStatus.AVERAGE || formData.homeLife === WellbeingStatus.POOR) && <FormTextArea label="Notes" id="homeLifeNotes" name="homeLifeNotes" value={formData.homeLifeNotes} onChange={handleChange} />}
                    <YesNoNASelect label="Drugs/Alcohol/Violence" id="drugsAlcoholViolence" name="drugsAlcoholViolence" value={formData.drugsAlcoholViolence} onChange={handleChange} />
                    {formData.drugsAlcoholViolence === YesNo.YES && <FormTextArea label="Notes" id="drugsAlcoholViolenceNotes" name="drugsAlcoholViolenceNotes" value={formData.drugsAlcoholViolenceNotes} onChange={handleChange} />}
                </FormSubSection>
            </FormSection>
            
            <FormSection title="Section 2a: Risk Factors">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">Current Risk Factors (Select all that apply)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-2 dark:bg-box-dark-2 rounded-lg">
                        {RISK_FACTORS.map(risk => (
                            <label key={risk} className="flex items-center space-x-2 text-sm text-black dark:text-white">
                                <input type="checkbox" checked={formData.riskFactorsList.includes(risk)} onChange={() => handleRiskToggle(risk)} className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                                <span>{risk}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <FormTextArea label="Details for selections above" id="riskFactorsDetails" name="riskFactorsDetails" value={formData.riskFactorsDetails} onChange={handleChange} className="md:col-span-2" />
                 <WellbeingSelect label="Condition of Home" id="conditionOfHome" name="conditionOfHome" value={formData.conditionOfHome} onChange={handleChange} />
                 {(formData.conditionOfHome === WellbeingStatus.AVERAGE || formData.conditionOfHome === WellbeingStatus.POOR) && <FormTextArea label="Notes" id="conditionOfHomeNotes" name="conditionOfHomeNotes" value={formData.conditionOfHomeNotes} onChange={handleChange} />}
                 <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <YesNoNASelect label="Mother Working?" id="motherWorking" name="motherWorking" value={formData.motherWorking} onChange={handleChange} />
                    <YesNoNASelect label="Father Working?" id="fatherWorking" name="fatherWorking" value={formData.fatherWorking} onChange={handleChange} />
                    <YesNoNASelect label="Other Family Member Working?" id="otherFamilyMemberWorking" name="otherFamilyMemberWorking" value={formData.otherFamilyMemberWorking} onChange={handleChange} />
                 </div>
                 <FormTextArea label="Current Work Details" id="currentWorkDetails" name="currentWorkDetails" value={formData.currentWorkDetails} onChange={handleChange} className="md:col-span-2" />
                 <YesNoNASelect label="Attending Church/House of Prayer?" id="attendingChurch" name="attendingChurch" value={formData.attendingChurch} onChange={handleChange} />
            </FormSection>

            <FormSection title="Section 4: EEP Staff Notes">
                <FormTextArea label="Notes" id="staffNotes" name="staffNotes" value={formData.staffNotes} onChange={handleChange} className="md:col-span-2" />
                <FormTextArea label="Changes/Recommendations" id="changesRecommendations" name="changesRecommendations" value={formData.changesRecommendations} onChange={handleChange} className="md:col-span-2" />
            </FormSection>

            <FormSection title="Section 5: Conclusion">
                <YesNoNASelect label="Child Protection Concerns?" id="childProtectionConcerns" name="childProtectionConcerns" value={formData.childProtectionConcerns} onChange={handleChange} />
                <YesNoNASelect label="Increased Human Trafficking Risk?" id="humanTraffickingRisk" name="humanTraffickingRisk" value={formData.humanTraffickingRisk} onChange={handleChange} />
            </FormSection>

            <FormSection title="Completion Details">
                <FormInput label="Completed By" id="completedBy" name="completedBy" value={formData.completedBy} onChange={handleChange} required />
                <FormInput label="Date Completed" id="dateCompleted" name="dateCompleted" type="date" value={formData.dateCompleted} onChange={handleChange} required />
            </FormSection>

            <FormSection title="Administrator Review">
                <p className="md:col-span-2 text-sm text-body-color dark:text-gray-400">This section is to be completed by an administrator upon review.</p>
                <FormInput label="Reviewed By" id="reviewedBy" name="reviewedBy" value={formData.reviewedBy} onChange={handleChange} />
                <FormInput label="Date Reviewed" id="dateReviewed" name="dateReviewed" type="date" value={formData.dateReviewed} onChange={handleChange} />
            </FormSection>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                <Button type="submit" isLoading={isSaving}>{isEdit ? 'Update Record' : 'Save Record'}</Button>
            </div>
        </form>
    );
};
export default FollowUpForm;