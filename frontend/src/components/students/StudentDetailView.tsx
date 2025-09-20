import React, { useState, useEffect } from 'react';
import { Student, FollowUpRecord } from '@/types.ts';
import Modal from '@/components/Modal.tsx';
import { EditIcon, TrashIcon, DocumentAddIcon, ArrowUpIcon, ArrowDownIcon, UserIcon } from '@/components/Icons.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { api } from '@/services/api.ts';
import DetailCard from './DetailCard.tsx';
import FollowUpRecordView from './FollowUpRecordView.tsx';
import AcademicReportForm from '@/components/AcademicReportForm.tsx';
import FollowUpForm from './FollowUpForm.tsx';
import PrintableFollowUpRecord from './PrintableFollowUpRecord.tsx';
import { usePdfGenerator } from '@/hooks/usePdfGenerator.ts';
import { calculateAge, formatDateForDisplay } from '@/utils/dateUtils.ts';
import Button from '@/components/ui/Button.tsx';
import Badge from '../ui/Badge.tsx';
import Tabs, { Tab } from '@/components/ui/Tabs.tsx';
import { usePermissions } from '@/contexts/AuthContext.tsx';
import { AcademicReportFormData } from '../schemas/academicReportSchema.ts';

interface StudentDetailViewProps {
    student: Student;
    onBack: () => void;
    onEdit: (student: Student) => void;
    onDelete: (studentId: string) => void;
    onDataChange: () => void;
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
    student, onBack, onEdit, onDelete, onDataChange,
}) => {
    const [modal, setModal] = useState<'add_report' | 'add_follow_up' | 'edit_follow_up' | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editingFollowUp, setEditingFollowUp] = useState<FollowUpRecord | null>(null);
    const [openFollowUpId, setOpenFollowUpId] = useState<string | null>(null);
    const [recordForPdf, setRecordForPdf] = useState<FollowUpRecord | null>(null);
    const printableRef = React.useRef<HTMLDivElement>(null);
    const { isGenerating: isGeneratingPdf, generatePdf } = usePdfGenerator(printableRef);
    const { showToast } = useNotification();
    const { canUpdate, canDelete } = usePermissions('students');
    const { canCreate: canCreateAcademics } = usePermissions('academics');

    const handleDownloadPdf = (record: FollowUpRecord) => {
        setRecordForPdf(record);
    };
    
    // Use an effect to generate the PDF after the state has updated and the component has rendered.
    // This avoids race conditions with the off-screen rendering.
    useEffect(() => {
        if (recordForPdf && printableRef.current) {
            const studentName = `${student.firstName} ${student.lastName}`.replace(/\s+/g, '-');
            const date = new Date(recordForPdf.dateOfFollowUp).toISOString().split('T')[0];
            generatePdf(`Follow-Up-Report-${studentName}-${date}`).finally(() => {
                setRecordForPdf(null); // Reset after generation is complete
            });
        }
    }, [recordForPdf, student, generatePdf]);

    const handleSaveAcademicReport = async (formData: AcademicReportFormData) => {
        setIsSaving(true);
        try {
            const { studentId, ...reportData } = formData;
            await api.addAcademicReport(studentId, reportData);
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
    
    const tabs: Tab[] = [
        {
            id: 'overview',
            label: 'Overview',
            content: (
                 <DetailCard title="Core Program Data" data={{
                    'Student Status': <Badge type={student.studentStatus} />,
                    'Sponsorship Status': <Badge type={student.sponsorshipStatus} />,
                    'Sponsor': student.sponsorName,
                    'Sponsorship Contract on File': student.hasSponsorshipContract,
                    'School': student.school,
                    'Current Grade': student.currentGrade,
                    'EEP Enroll Date': formatDateForDisplay(student.eepEnrollDate),
                }} />
            )
        },
        {
            id: 'details',
            label: 'Detailed Info',
            content: (
                <div className="space-y-6">
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
                </div>
            )
        },
        {
            id: 'academics',
            label: 'Academic Reports',
            content: (
                <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-black dark:text-white">Academic Reports</h3>
                        {canCreateAcademics && <Button onClick={() => setModal('add_report')} icon={<DocumentAddIcon className="w-5 h-5" />} size="sm">Add Report</Button>}
                    </div>
                    {student.academicReports && student.academicReports.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="ui-table">
                                <thead>
                                    <tr>
                                        <th>Period</th>
                                        <th>Grade</th>
                                        <th>Average</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {student.academicReports.sort((a,b) => a.reportPeriod < b.reportPeriod ? 1 : -1).map(report => (
                                        <tr key={report.id}>
                                            <td>{report.reportPeriod}</td>
                                            <td className="text-body-color">{report.gradeLevel}</td>
                                            <td className="text-body-color">{report.overallAverage ? report.overallAverage.toFixed(1) + '%' : 'N/A'}</td>
                                            <td><Badge type={report.passFailStatus} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-body-color dark:text-gray-300 text-center py-4">No academic reports found.</p>
                    )}
                </div>
            )
        },
        {
            id: 'followups',
            label: 'Follow-up History',
            content: (
                <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-black dark:text-white">Follow-up History</h3>
                        {canCreateAcademics && <Button onClick={() => { setEditingFollowUp(null); setModal('add_follow_up'); }} icon={<DocumentAddIcon className="w-5 h-5" />} size="sm">New Follow-up</Button>}
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
                                        <span>{openFollowUpId === record.id ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}</span>
                                    </button>
                                    {openFollowUpId === record.id && <FollowUpRecordView record={record} onEdit={(record) => { setEditingFollowUp(record); setModal('edit_follow_up'); }} onDownload={handleDownloadPdf} isGeneratingPdf={isGeneratingPdf} isCurrentPdfTarget={record.id === recordForPdf?.id} />}
                                </div>
                            ))
                        ) : (
                            <p className="text-body-color dark:text-gray-300 text-center py-4">No follow-up records found for this student.</p>
                        )}
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <button onClick={onBack} className="text-primary hover:underline font-medium">← Back to Student List</button>
                 <div className="flex gap-2">
                     {canUpdate && <Button onClick={() => onEdit(student)} icon={<EditIcon className="w-5 h-5" />}>Edit</Button>}
                     {canDelete && <Button onClick={() => onDelete(student.studentId)} variant="danger" icon={<TrashIcon className="w-5 h-5" />}>Delete</Button>}
                 </div>
            </div>

            <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-md p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    {student.profilePhoto ? (
                        <img src={student.profilePhoto} alt={`${student.firstName}`} className="w-32 h-32 rounded-full object-cover" />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center">
                            <UserIcon className="w-16 h-16 text-gray-500 dark:text-gray-400" />
                        </div>
                    )}
                    <div className="flex-grow text-center md:text-left">
                        <h2 className="text-2xl font-bold text-black dark:text-white">{student.firstName} {student.lastName}</h2>
                        <p className="text-body-color dark:text-gray-300">{student.studentId}</p>
                        <p className="text-body-color dark:text-gray-300">Age: {calculateAge(student.dateOfBirth)} | Gender: {student.gender}</p>
                    </div>
                </div>
            </div>
            
            <Tabs tabs={tabs} />
            
            {modal === 'add_report' && (
                <Modal isOpen={true} onClose={() => setModal(null)} title="Add Academic Report">
                    <AcademicReportForm 
                        studentId={student.studentId}
                        onSave={handleSaveAcademicReport} 
                        onCancel={() => setModal(null)}
                        isSaving={isSaving}
                    />
                </Modal>
            )}
            {(modal === 'add_follow_up' || modal === 'edit_follow_up') && (
                <Modal isOpen={true} onClose={() => { setModal(null); setEditingFollowUp(null); }} title={editingFollowUp ? "Edit Follow-up Report" : "Add Monthly Follow-up Report"}>
                    <FollowUpForm 
                        student={student} 
                        onSave={handleSaveFollowUp} 
                        onCancel={() => { setModal(null); setEditingFollowUp(null); }} 
                        initialData={editingFollowUp}
                        isSaving={isSaving}
                    />
                </Modal>
            )}
            {recordForPdf && (
                 <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }} ref={printableRef}>
                    <PrintableFollowUpRecord record={recordForPdf} student={student} />
                </div>
            )}
        </div>
    );
};
export default StudentDetailView;