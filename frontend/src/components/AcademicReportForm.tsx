import React, { useState } from 'react';
import { AcademicReport, Student } from '../types';
import { FormInput, FormSelect, FormTextArea } from './forms/FormControls';

type ReportFormData = Omit<AcademicReport, 'id' | 'student_id' | 'student_name'>;

interface AcademicReportFormProps {
    onSave: (data: ReportFormData, student_id: string) => void;
    onCancel: () => void;
    students: Student[];
    initialData?: AcademicReport | null;
    studentId?: string; // Pre-selected student ID
}

const AcademicReportForm: React.FC<AcademicReportFormProps> = ({ 
    onSave, 
    onCancel, 
    students, 
    initialData, 
    studentId: preselectedStudentId 
}) => {
    const isEdit = !!initialData;
    
    const [studentId, setStudentId] = useState(preselectedStudentId || initialData?.student_id || '');
    const [formData, setFormData] = useState<ReportFormData>({
        report_period: initialData?.report_period || '',
        grade_level: initialData?.grade_level || '',
        subjects_and_grades: initialData?.subjects_and_grades || '',
        overall_average: initialData?.overall_average || 0,
        pass_fail_status: initialData?.pass_fail_status || 'Pass',
        teacher_comments: initialData?.teacher_comments || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'overall_average' ? parseFloat(value) || 0 : value }));
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
                    {students.map(s => <option key={s.student_id} value={s.student_id}>{s.first_name} {s.last_name} ({s.student_id})</option>)}
                </FormSelect>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Report Period (e.g., Term 1 2024)" id="report_period" name="report_period" value={formData.report_period} onChange={handleChange} required />
                <FormInput label="Grade Level" id="grade_level" name="grade_level" value={formData.grade_level} onChange={handleChange} required />
                <FormInput label="Overall Average" id="overall_average" name="overall_average" type="number" step="0.1" value={formData.overall_average} onChange={handleChange} />
                <FormSelect label="Pass/Fail Status" id="pass_fail_status" name="pass_fail_status" value={formData.pass_fail_status} onChange={handleChange}>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                </FormSelect>
            </div>
            <div>
                <FormTextArea label="Subjects & Grades" id="subjects_and_grades" name="subjects_and_grades" value={formData.subjects_and_grades} onChange={handleChange} placeholder="e.g., Math: A, Science: B+" />
            </div>
            <div>
                <FormTextArea label="Teacher Comments" id="teacher_comments" name="teacher_comments" value={formData.teacher_comments} onChange={handleChange} />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray dark:bg-box-dark-2 hover:opacity-90">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-white hover:opacity-90">{isEdit ? 'Update Report' : 'Save Report'}</button>
            </div>
        </form>
    );
};

export default AcademicReportForm;
