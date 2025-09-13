import React, { useState } from 'react';
import { AcademicReport, StudentLookup } from '../types.ts';
import { FormInput, FormSelect, FormTextArea } from './forms/FormControls.tsx';
import Button from './ui/Button.tsx';
import { useData } from '@/contexts/DataContext.tsx';

type ReportFormData = Omit<AcademicReport, 'id' | 'studentId' | 'studentName'>;

interface AcademicReportFormProps {
    onSave: (data: ReportFormData, studentId: string) => void;
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
    
    const [studentId, setStudentId] = useState(preselectedStudentId || initialData?.studentId || '');
    const [formData, setFormData] = useState<ReportFormData>({
        reportPeriod: initialData?.reportPeriod || '',
        gradeLevel: initialData?.gradeLevel || '',
        subjectsAndGrades: initialData?.subjectsAndGrades || '',
        overallAverage: initialData?.overallAverage || 0,
        passFailStatus: initialData?.passFailStatus || 'Pass',
        teacherComments: initialData?.teacherComments || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'overallAverage' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId) {
            alert('Please select a student.');
            return;
        }
        onSave(formData, studentId);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <FormSelect label="Student" id="student_id" name="student_id" value={studentId} onChange={e => setStudentId(e.target.value)} required disabled={isEdit || !!preselectedStudentId}>
                    <option value="">-- Select Student --</option>
                    {students.map(s => <option key={s.studentId} value={s.studentId}>{s.firstName} {s.lastName} ({s.studentId})</option>)}
                </FormSelect>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Report Period (e.g., Term 1 2024)" id="reportPeriod" name="reportPeriod" value={formData.reportPeriod} onChange={handleChange} required />
                <FormInput label="Grade Level" id="gradeLevel" name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} required />
                <FormInput label="Overall Average" id="overallAverage" name="overallAverage" type="number" step="0.1" value={formData.overallAverage} onChange={handleChange} />
                <FormSelect label="Pass/Fail Status" id="passFailStatus" name="passFailStatus" value={formData.passFailStatus} onChange={handleChange}>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                </FormSelect>
            </div>
            <div>
                <FormTextArea label="Subjects & Grades" id="subjectsAndGrades" name="subjectsAndGrades" value={formData.subjectsAndGrades} onChange={handleChange} placeholder="e.g., Math: A, Science: B+" />
            </div>
            <div>
                <FormTextArea label="Teacher Comments" id="teacherComments" name="teacherComments" value={formData.teacherComments} onChange={handleChange} />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                <Button type="submit" isLoading={isSaving}>{isEdit ? 'Update Report' : 'Save Report'}</Button>
            </div>
        </form>
    );
};

export default AcademicReportForm;