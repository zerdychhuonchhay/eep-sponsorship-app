import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AcademicReport } from '../types.ts';
import { FormInput, FormSelect, FormTextArea } from './forms/FormControls.tsx';
import Button from './ui/Button.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import { academicReportSchema, AcademicReportFormData } from '@/components/schemas/academicReportSchema.ts';

interface AcademicReportFormProps {
    onSave: (data: AcademicReportFormData) => void;
    onCancel: () => void;
    initialData?: AcademicReport | null;
    studentId?: string; // Pre-selected student ID
    isSaving: boolean;
}

const AcademicReportForm: React.FC<AcademicReportFormProps> = ({ 
    onSave, 
    onCancel, 
    initialData, 
    studentId: preselectedStudentId,
    isSaving
}) => {
    const isEdit = !!initialData;
    const { studentLookup: students } = useData();
    
    const { register, handleSubmit, formState: { errors } } = useForm<AcademicReportFormData>({
        resolver: zodResolver(academicReportSchema),
        defaultValues: {
            studentId: preselectedStudentId || initialData?.student || '',
            reportPeriod: initialData?.reportPeriod || '',
            gradeLevel: initialData?.gradeLevel || '',
            subjectsAndGrades: initialData?.subjectsAndGrades || '',
            overallAverage: initialData?.overallAverage || undefined,
            passFailStatus: initialData?.passFailStatus || 'Pass',
            teacherComments: initialData?.teacherComments || ''
        }
    });

    const onSubmit = (data: AcademicReportFormData) => {
        if (!data.studentId) {
             // This should ideally be caught by validation, but as a safeguard:
            alert('Please select a student.');
            return;
        }
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
             <div>
                <FormSelect 
                    label="Student" 
                    id="studentId" 
                    {...register('studentId')} 
                    required 
                    disabled={isEdit || !!preselectedStudentId}
                    error={errors.studentId?.message}
                >
                    <option value="">-- Select Student --</option>
                    {students.map(s => <option key={s.studentId} value={s.studentId}>{s.firstName} {s.lastName} ({s.studentId})</option>)}
                </FormSelect>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Report Period (e.g., Term 1 2024)" id="reportPeriod" {...register('reportPeriod')} required error={errors.reportPeriod?.message} />
                <FormInput label="Grade Level" id="gradeLevel" {...register('gradeLevel')} required error={errors.gradeLevel?.message} />
                <FormInput label="Overall Average" id="overallAverage" type="number" step="0.1" {...register('overallAverage', { valueAsNumber: true })} error={errors.overallAverage?.message} />
                <FormSelect label="Pass/Fail Status" id="passFailStatus" {...register('passFailStatus')} error={errors.passFailStatus?.message}>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                </FormSelect>
            </div>
            <div>
                <FormTextArea label="Subjects & Grades" id="subjectsAndGrades" placeholder="e.g., Math: A, Science: B+" {...register('subjectsAndGrades')} error={errors.subjectsAndGrades?.message} />
            </div>
            <div>
                <FormTextArea label="Teacher Comments" id="teacherComments" {...register('teacherComments')} error={errors.teacherComments?.message} />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                <Button type="submit" isLoading={isSaving}>{isEdit ? 'Update Report' : 'Save Report'}</Button>
            </div>
        </form>
    );
};

export default AcademicReportForm;