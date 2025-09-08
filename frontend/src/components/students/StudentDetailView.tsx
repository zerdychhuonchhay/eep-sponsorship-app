import React, { useState, useCallback } from 'react';
import { Student, FollowUpRecord, AcademicReport, StudentLookup } from '@/types.ts';
import Modal from '@/components/Modal.tsx';
import { EditIcon, TrashIcon, DocumentAddIcon, ArrowUpIcon, ArrowDownIcon, UserIcon } from '@/components/Icons.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { api } from '@/services/api.ts';
import DetailCard from './DetailCard.tsx';
import FollowUpRecordView from './FollowUpRecordView.tsx';
import AcademicReportForm from '@/components/AcademicReportForm.tsx';
import FollowUpForm from './FollowUpForm.tsx';
import { calculateAge, formatDateForDisplay } from '@/pages/StudentsPage.tsx';
import Button from '@/components/ui/Button.tsx';

interface StudentDetailViewProps {
    student: Student;
    students: StudentLookup[];
    onBack: () => void;
    onEdit: (student: Student) => void;
    onDelete: (studentId: string) => void;
    onDownloadFollowUp: (record: FollowUpRecord) => void;
    onDataChange: () => void;
    isGeneratingPdf: boolean;
    recordForPdf: FollowUpRecord | null;
}

const NarrativeDetailCard: React.FC<{ title: string; data: Record<string, any> }> = ({ title, data }) => (
    <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-md p-6">
        <h3 className="text-xl font-semibold text-black dark:text-white mb-4">{title}</h3>
        <div className="space-y-4">
            {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                    <p className="text-sm text-body-color dark:text-gray-300 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="font-medium text-black dark:text-white whitespace-pre-wrap">{value || 'N/A'}</p>
                </div>
            ))}
        </div>
    </div>
);


const StudentDetailView: React.FC<StudentDetailViewProps> = ({ 
    student, students, onBack, onEdit, onDelete, onDownloadFollowUp, onDataChange,
    isGeneratingPdf, recordForPdf
}) => {
    const [modal, setModal] = useState<'add_report' | 'add_follow_up' | 'edit_follow_up' | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editingFollowUp, setEditingFollowUp] = useState<FollowUpRecord | null>(null);
    const [openFollowUpId, setOpenFollowUpId] = useState<string | null>(null);
    const { showToast } = useNotification();

    const handleSaveAcademicReport = async (reportData: Omit<AcademicReport, 'id' | 'studentId' | 'studentName'>) => {
        setIsSaving(true);
        try {
            await api.addAcademicReport(student.studentId, reportData);
            showToast('Academic report added!', 'success');
            setModal(null);
            onDataChange();
        } catch (error: any) {
            showToast(error.message || 'Failed to add report.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveFollowUp = async (recordData: any) => {
        setIsSaving(true);
        try {
            if (editingFollowUp) {
                await api.updateFollowUpRecord(editingFollowUp.id, { ...recordData });
                showToast('Follow-up record updated!', 'success');
            } else {
                await api.addFollowUpRecord(student.studentId, recordData);
                showToast('Follow-up record added!', 'success');
            }
            setModal(null);
            setEditingFollowUp(null);
            onDataChange();
        } catch (error: any) {
            showToast(error.message || 'Failed to save record.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <button onClick={onBack} className="text-primary hover:underline font-medium">← Back to Student List</button>
                 <div className="flex gap-2">
                     <Button onClick={() => onEdit(student)} icon={<EditIcon />}>Edit</Button>
                    <Button onClick={() => onDelete(student.studentId)} variant="danger" icon={<TrashIcon />}>Delete</Button>
                 </div>
            </div>

            <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-md p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    {student.profilePhoto ? (
                        <img src={student.profilePhoto} alt={`${student.firstName}`} className="w-32 h-32 rounded-full object-cover" />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center">
                            <UserIcon className="w-20 h-20 text-gray-500 dark:text-gray-400" />
                        </div>
                    )}
                    <div className="flex-grow text-center md:text-left">
                        <h2 className="text-2xl font-bold text-black dark:text-white">{student.firstName} {student.lastName}</h2>
                        <p className="text-body-color dark:text-gray-300">{student.studentId}</p>
                        <p className="text-body-color dark:text-gray-300">Age: {calculateAge(student.dateOfBirth)} | Gender: {student.gender}</p>
                    </div>
                </div>
            </div>
            
            <DetailCard title="Core Program Data" data={{
                'Student Status': student.studentStatus,
                'Sponsorship Status': student.sponsorshipStatus,
                'Sponsor Name': student.sponsorName,
                'Sponsorship Contract on File': student.hasSponsorshipContract,
                'School': student.school,
                'Current Grade': student.currentGrade,
                'EEP Enroll Date': formatDateForDisplay(student.eepEnrollDate),
            }} />
            
            <DetailCard title="Personal & Family Details" data={{
                 'Date of Birth': formatDateForDisplay(student.dateOfBirth),
                 'City': student.city,
                 'Village/Slum': student.villageSlum,
                 'Guardian Name': student.guardianName,
                 'Guardian Contact': student.guardianContactInfo,
                 'Siblings': student.siblingsCount,
                 'Household Members': student.householdMembersCount,
                 'Annual Income': `$${student.annualIncome}`,
                 'Transportation': student.transportation,
            }} />
            <NarrativeDetailCard title="Risk & Health Assessment" data={{
                'Risk Level': `${student.riskLevel}/5`,
                'Health Status': student.healthStatus,
                'Health Issues': student.healthIssues,
                'Interaction with Others': student.interactionWithOthers,
                'Interaction Issues': student.interactionIssues,
            }} />
             <NarrativeDetailCard title="Narrative Information" data={{ 'Child Story': student.childStory, 'Other Notes': student.otherNotes }} />
            
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-black dark:text-white">Academic Reports</h3>
                    <Button onClick={() => setModal('add_report')} icon={<DocumentAddIcon />} size="sm">Add Report</Button>
                 </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-black dark:text-white">Follow-up History</h3>
                    <Button onClick={() => { setEditingFollowUp(null); setModal('add_follow_up'); }} icon={<DocumentAddIcon />} size="sm">New Follow-up</Button>
                </div>
                <div className="space-y-2">
                    {student.followUpRecords && student.followUpRecords.length > 0 ? (
                        student.followUpRecords
                            .sort((a,b) => new Date(b.dateOfFollowUp).getTime() - new Date(a.dateOfFollowUp).getTime())
                            .map(record => (
                            <div key={record.id} className="border border-stroke dark:border-strokedark rounded-lg">
                                <button
                                    onClick={() => setOpenFollowUpId(openFollowUpId === record.id ? null : record.id)}
                                    className="w-full p-4 text-left flex justify-between items-center bg-gray-2 dark:bg-box-dark-2 hover:bg-gray/80"
                                >
                                    <span className="font-semibold text-black dark:text-white">Follow-up from {formatDateForDisplay(record.dateOfFollowUp)}</span>
                                    <span>{openFollowUpId === record.id ? <ArrowUpIcon /> : <ArrowDownIcon />}</span>
                                </button>
                                {openFollowUpId === record.id && <FollowUpRecordView record={record} onEdit={(record) => { setEditingFollowUp(record); setModal('edit_follow_up'); }} onDownload={onDownloadFollowUp} isGeneratingPdf={isGeneratingPdf} isCurrentPdfTarget={record.id === recordForPdf?.id} />}
                            </div>
                        ))
                    ) : (
                        <p className="text-body-color dark:text-gray-300">No follow-up records found for this student.</p>
                    )}
                </div>
            </div>

            {modal === 'add_report' && (
                <Modal isOpen={true} onClose={() => setModal(null)} title="Add Academic Report">
                    <AcademicReportForm 
                        studentId={student.studentId}
                        students={students}
                        onSave={(data) => handleSaveAcademicReport(data)} 
                        onCancel={() => setModal(null)}
                        isSaving={isSaving}
                    />
                </Modal>
            )}
            {(modal === 'add_follow_up' || modal === 'edit_follow_up') && (
                <Modal isOpen={true} onClose={() => setModal(null)} title={editingFollowUp ? "Edit Follow-up Report" : "Add Monthly Follow-up Report"}>
                    <FollowUpForm 
                        student={student} 
                        onSave={handleSaveFollowUp} 
                        onCancel={() => setModal(null)} 
                        initialData={editingFollowUp}
                        isSaving={isSaving}
                    />
                </Modal>
            )}
        </div>
    );
};
export default StudentDetailView;