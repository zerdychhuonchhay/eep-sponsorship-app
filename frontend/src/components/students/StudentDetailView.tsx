import React, { useState, useEffect } from 'react';
import { Student, FollowUpRecord, AcademicReport, Sponsorship, DocumentType, StudentDocument, StudentStatus, SponsorshipStatus } from '@/types.ts';
import Modal from '@/components/Modal.tsx';
import { EditIcon, TrashIcon, DocumentAddIcon, ArrowUpIcon, ArrowDownIcon, UserIcon, DownloadIcon, CheckCircleIcon, XCircleIcon } from '@/components/Icons.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { api } from '@/services/api.ts';
import DetailCard from './DetailCard.tsx';
import FollowUpRecordView from './FollowUpRecordView.tsx';
import AcademicReportForm from '@/components/AcademicReportForm.tsx';
import { FormInput, FormSelect } from '@/components/forms/FormControls.tsx';
import FollowUpForm from './FollowUpForm.tsx';
import PrintableFollowUpRecord from './PrintableFollowUpRecord.tsx';
import SponsorshipFormModal from './SponsorshipFormModal.tsx';
import { usePdfGenerator } from '@/hooks/usePdfGenerator.ts';
import { calculateAge, formatDateForDisplay } from '@/utils/dateUtils.ts';
import Button from '@/components/ui/Button.tsx';
import Badge from '../ui/Badge.tsx';
import Tabs, { Tab } from '@/components/ui/Tabs.tsx';
import { usePermissions } from '@/contexts/AuthContext.tsx';
import { AcademicReportFormData } from '../schemas/academicReportSchema.ts';
import ActionDropdown from '@/components/ActionDropdown.tsx';
import DocumentUploadModal from './DocumentUploadModal.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import PageActions from '@/components/layout/PageActions.tsx';

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
    const [modal, setModal] = useState<'add_report' | 'edit_report' | 'add_follow_up' | 'edit_follow_up' | 'sponsorship' | 'upload_doc' | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editingFollowUp, setEditingFollowUp] = useState<FollowUpRecord | null>(null);
    const [editingReport, setEditingReport] = useState<AcademicReport | null>(null);
    const [editingSponsorship, setEditingSponsorship] = useState<Sponsorship | null>(null);
    const [openFollowUpId, setOpenFollowUpId] = useState<string | null>(null);
    const [recordForPdf, setRecordForPdf] = useState<FollowUpRecord | null>(null);
    const [docUploadProps, setDocUploadProps] = useState<{ docType: DocumentType, sponsorship?: Sponsorship } | null>(null);
    const printableRef = React.useRef<HTMLDivElement>(null);
    const { isGenerating: isGeneratingPdf, generatePdf } = usePdfGenerator(printableRef);
    const { showToast } = useNotification();
    const { canUpdate, canDelete } = usePermissions('students');
    const { canCreate: canCreateAcademics, canUpdate: canUpdateAcademics, canDelete: canDeleteAcademics } = usePermissions('academics');
    const { canManageSponsors, canUpdate: canUpdateSponsors } = usePermissions('sponsors');
    
    const [editingField, setEditingField] = useState<string | null>(null);
    const [isUpdatingField, setIsUpdatingField] = useState(false);

    const handleDownloadPdf = (record: FollowUpRecord) => {
        setRecordForPdf(record);
    };
    
    useEffect(() => {
        if (recordForPdf && printableRef.current) {
            const studentName = `${student.firstName} ${student.lastName}`.replace(/\s+/g, '-');
            const date = new Date(recordForPdf.dateOfFollowUp).toISOString().split('T')[0];
            generatePdf(`Follow-Up-Report-${studentName}-${date}`).finally(() => {
                setRecordForPdf(null);
            });
        }
    }, [recordForPdf, student, generatePdf]);

    const handleInlineUpdate = async (field: keyof Student, value: string) => {
        if (value === student[field]) {
            setEditingField(null);
            return;
        }

        setIsUpdatingField(true);
        try {
            await api.updateStudent({ studentId: student.studentId, [field]: value } as any);
            // FIX: Cast `field` to a string to ensure the `replace` method is available, resolving a TypeScript error.
            const fieldName = String(field).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            showToast(`${fieldName} updated!`, 'success');
            onDataChange();
        } catch (error: any) {
            showToast(error.message || 'Failed to update.', 'error');
        } finally {
            setIsUpdatingField(false);
            setEditingField(null);
        }
    };

    const renderEditableField = (field: keyof Student, type: 'text' | 'select', options?: string[]) => {
        const isEditing = editingField === field;

        if (isEditing) {
            if (type === 'select') {
                return (
                    <FormSelect
                        id={`inline-edit-${field}`}
                        className="py-1 -my-1 -mx-2"
                        value={student[field] as string}
                        onChange={(e) => handleInlineUpdate(field, e.target.value)}
                        onBlur={() => setEditingField(null)}
                        disabled={isUpdatingField}
                        autoFocus
                    >
                        {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </FormSelect>
                );
            } else { // text
                return (
                    <FormInput
                        id={`inline-edit-${field}`}
                        className="py-1 -my-1 -mx-2"
                        defaultValue={student[field] as string}
                        onBlur={(e) => handleInlineUpdate(field, e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleInlineUpdate(field, (e.target as HTMLInputElement).value);
                            if (e.key === 'Escape') setEditingField(null);
                        }}
                        disabled={isUpdatingField}
                        autoFocus
                    />
                );
            }
        }

        let displayValue: React.ReactNode = (student[field] as string) || 'N/A';
        if (field === 'studentStatus' || field === 'sponsorshipStatus') {
            displayValue = <Badge type={student[field] as string} />;
        }

        return (
            // FIX: Cast `field` to a string before setting state to match the expected `string | null` type.
            <div onClick={() => canUpdate && !isUpdatingField && setEditingField(String(field))} className="flex items-center gap-2 cursor-pointer group min-h-[2.5rem]">
                {displayValue}
                {canUpdate && <EditIcon className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
        );
    };
    
    const handleSaveAcademicReport = async (formData: AcademicReportFormData) => {
        setIsSaving(true);
        try {
            const { studentId, ...reportData } = formData;
            if (editingReport) {
                await api.updateAcademicReport(editingReport.id, { ...reportData, student: studentId });
                showToast('Academic report updated!', 'success');
            } else {
                await api.addAcademicReport(studentId, reportData);
                showToast('Academic report added!', 'success');
            }
            setModal(null);
            setEditingReport(null);
            onDataChange();
        } catch (error: any) {
            showToast(error.message || 'Failed to add report.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAcademicReport = async (reportId: string) => {
        if (window.confirm('Are you sure you want to delete this academic report?')) {
            try {
                await api.deleteAcademicReport(reportId);
                showToast('Academic report deleted.', 'success');
                onDataChange();
            } catch (error: any) {
                showToast(error.message || 'Failed to delete report.', 'error');
            }
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
    
     const handleDeleteDocument = async (doc: StudentDocument) => {
        if (!window.confirm(`Are you sure you want to delete "${doc.originalFilename}"?`)) return;

        try {
            await api.deleteStudentDocument(doc.id, student.studentId);
            // If it was a birth cert, also update the student boolean for consistency
            if (doc.documentType === DocumentType.BIRTH_CERTIFICATE) {
                await api.updateStudent({ studentId: student.studentId, hasBirthCertificate: false });
            }
            showToast('Document deleted.', 'success');
            onDataChange();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete document.', 'error');
        }
    };

    const handleMarkContractMissing = async (sponsorship: Sponsorship) => {
        if (!window.confirm(`This will mark the contract for ${sponsorship.sponsorName} as missing. You will need to manually delete the associated file from the 'Uploaded Documents' list below. Proceed?`)) return;

        try {
            await api.updateSponsorship(sponsorship.id, { hasSponsorshipContract: false });
            showToast('Contract marked as missing.', 'success');
            onDataChange();
        } catch (error: any) {
            showToast(error.message || 'Failed to update contract status.', 'error');
        }
    };


    const activeSponsors = student.sponsorships?.filter(s => !s.endDate) || [];
    const birthCert = student.documents?.find(d => d.documentType === DocumentType.BIRTH_CERTIFICATE);
    
    const tabs: Tab[] = [
        {
            id: 'overview',
            label: 'Overview',
            content: (
                 <DetailCard title="Core Program Data" data={{
                    'Student Status': renderEditableField('studentStatus', 'select', Object.values(StudentStatus)),
                    'Sponsorship Status': renderEditableField('sponsorshipStatus', 'select', Object.values(SponsorshipStatus)),
                    'School': renderEditableField('school', 'text'),
                    'Current Grade': renderEditableField('currentGrade', 'text'),
                    'Active Sponsors': activeSponsors.length > 0 ? activeSponsors.map(s => s.sponsorName).join(', ') : 'N/A',
                    'EEP Enroll Date': formatDateForDisplay(student.eepEnrollDate),
                }} />
            )
        },
        {
            id: 'sponsorships',
            label: 'Sponsorships',
            content: (
                <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-black dark:text-white">Sponsorship History</h3>
                        {canManageSponsors && <Button onClick={() => { setEditingSponsorship(null); setModal('sponsorship'); }} icon={<DocumentAddIcon className="w-5 h-5" />} size="sm">Add Sponsorship</Button>}
                    </div>
                    {student.sponsorships && student.sponsorships.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="ui-table">
                                <thead>
                                    <tr>
                                        <th>Sponsor</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Contract</th>
                                        {canManageSponsors && <th className="text-center">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {student.sponsorships.map(sponsorship => (
                                        <tr key={sponsorship.id}>
                                            <td className="font-medium">{sponsorship.sponsorName}</td>
                                            <td>{formatDateForDisplay(sponsorship.startDate)}</td>
                                            <td>{sponsorship.endDate ? formatDateForDisplay(sponsorship.endDate) : <Badge type="Active" />}</td>
                                             <td>
                                                <Badge type={sponsorship.hasSponsorshipContract ? 'Submitted' : 'Pending'} />
                                            </td>
                                            {canManageSponsors && (
                                                <td className="text-center">
                                                    <Button onClick={() => { setEditingSponsorship(sponsorship); setModal('sponsorship'); }} icon={<EditIcon className="w-4 h-4" />} size="sm" variant="ghost">Edit</Button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-body-color dark:text-gray-300 text-center py-4">No sponsorship records found.</p>
                    )}
                </div>
            )
        },
        {
            id: 'documents',
            label: 'Documents',
            content: (
                 <div className="space-y-6">
                    <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-md p-6">
                        <h3 className="text-xl font-semibold text-black dark:text-white mb-4">Document Checklist</h3>
                        <div className="space-y-4">
                            {/* Birth Certificate */}
                            <div className="flex items-center justify-between p-3 bg-gray-2 dark:bg-box-dark-2 rounded-lg">
                                <div>
                                    <p className="font-semibold text-black dark:text-white">Birth Certificate</p>
                                    <div className={`flex items-center gap-1.5 text-sm ${birthCert ? 'text-success' : 'text-warning'}`}>
                                        {birthCert ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                                        <span>{birthCert ? 'Uploaded' : 'Missing'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {birthCert && <a href={birthCert.file} target="_blank" rel="noopener noreferrer" download><Button size="sm" variant="ghost">View</Button></a>}
                                    {canUpdate && <Button onClick={() => { setDocUploadProps({ docType: DocumentType.BIRTH_CERTIFICATE }); setModal('upload_doc'); }} size="sm">{birthCert ? 'Replace' : 'Upload'}</Button>}
                                    {birthCert && canDelete && <Button onClick={() => handleDeleteDocument(birthCert)} size="sm" variant="danger" icon={<TrashIcon className="w-4 h-4"/>}/>}
                                </div>
                            </div>

                             {/* Sponsorship Contracts */}
                             <div className="p-3 bg-gray-2 dark:bg-box-dark-2 rounded-lg">
                                 <p className="font-semibold text-black dark:text-white mb-2">Sponsorship Contracts</p>
                                 <div className="space-y-2">
                                    {activeSponsors.length > 0 ? activeSponsors.map(sp => (
                                        <div key={sp.id} className="flex items-center justify-between p-2 bg-white dark:bg-box-dark rounded">
                                            <div>
                                                <p className="text-sm font-medium text-black dark:text-white">Contract for: {sp.sponsorName}</p>
                                                <div className={`flex items-center gap-1.5 text-xs ${sp.hasSponsorshipContract ? 'text-success' : 'text-warning'}`}>
                                                    {sp.hasSponsorshipContract ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                                                    <span>{sp.hasSponsorshipContract ? 'Uploaded' : 'Missing'}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {sp.hasSponsorshipContract && canUpdateSponsors && <Button onClick={() => handleMarkContractMissing(sp)} size="sm" variant="ghost">Mark as Missing</Button>}
                                                {canUpdateSponsors && <Button onClick={() => { setDocUploadProps({ docType: DocumentType.SPONSORSHIP_CONTRACT, sponsorship: sp }); setModal('upload_doc'); }} size="sm">{sp.hasSponsorshipContract ? 'Replace' : 'Upload'}</Button>}
                                            </div>
                                        </div>
                                    )) : <p className="text-sm text-body-color italic">No active sponsorships.</p>}
                                 </div>
                             </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-md p-6">
                        <h3 className="text-xl font-semibold text-black dark:text-white mb-4">All Uploaded Documents</h3>
                         {student.documents && student.documents.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>Document Type</th>
                                            <th>File Name</th>
                                            <th>Uploaded On</th>
                                            <th className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {student.documents.map(doc => (
                                            <tr key={doc.id}>
                                                <td className="font-medium">{doc.documentType.replace(/_/g, ' ')}</td>
                                                <td className="text-body-color">{doc.originalFilename}</td>
                                                <td className="text-body-color">{formatDateForDisplay(doc.uploadedAt)}</td>
                                                <td className="text-center">
                                                     <div className="flex items-center justify-center gap-2">
                                                        <a href={doc.file} target="_blank" rel="noopener noreferrer" download>
                                                            <Button size="sm" variant="ghost" icon={<DownloadIcon className="w-4 h-4"/>}>Download</Button>
                                                        </a>
                                                        {canDelete && <Button size="sm" variant="danger" icon={<TrashIcon className="w-4 h-4" />} onClick={() => handleDeleteDocument(doc)} />}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-body-color dark:text-gray-300 text-center py-4">No documents have been uploaded for this student.</p>
                        )}
                    </div>
                </div>
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
                         'Annual Income': student.annualIncome ? `$${student.annualIncome}` : 'N/A',
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
                        {canCreateAcademics && <Button onClick={() => { setEditingReport(null); setModal('add_report'); }} icon={<DocumentAddIcon className="w-5 h-5" />} size="sm">Add Report</Button>}
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
                                        {(canUpdateAcademics || canDeleteAcademics) && <th className="text-center">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {student.academicReports.sort((a,b) => a.reportPeriod < b.reportPeriod ? 1 : -1).map(report => {
                                        const actionItems = [];
                                        if (canUpdateAcademics) {
                                            actionItems.push({ label: 'Edit', icon: <EditIcon className="w-4 h-4" />, onClick: () => { setEditingReport(report); setModal('edit_report'); } });
                                        }
                                        if (canDeleteAcademics) {
                                            actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleDeleteAcademicReport(report.id), className: 'text-danger' });
                                        }

                                        return (
                                            <tr key={report.id}>
                                                <td>{report.reportPeriod}</td>
                                                <td className="text-body-color">{report.gradeLevel}</td>
                                                <td className="text-body-color">{report.overallAverage ? report.overallAverage.toFixed(1) + '%' : 'N/A'}</td>
                                                <td><Badge type={report.passFailStatus} /></td>
                                                {(canUpdateAcademics || canDeleteAcademics) && (
                                                    <td className="text-center">
                                                        {actionItems.length > 0 && <ActionDropdown items={actionItems} />}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
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
        },
    ];

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="text-primary hover:underline font-medium mb-6">← Back to Student List</button>
            
            <PageHeader title={`${student.firstName} ${student.lastName}`}>
                 <PageActions>
                    {canCreateAcademics && (
                        <Button
                            onClick={() => { setEditingFollowUp(null); setModal('add_follow_up'); }}
                            icon={<DocumentAddIcon className="w-5 h-5" />}
                            aria-label="New Follow-up"
                        >
                           <span className="hidden sm:inline">New Follow-up</span>
                        </Button>
                    )}
                     {canUpdate && <Button onClick={() => onEdit(student)} icon={<EditIcon className="w-5 h-5" />} aria-label="Edit Student"><span className="hidden sm:inline">Edit</span></Button>}
                     {canDelete && <Button onClick={() => onDelete(student.studentId)} variant="danger" icon={<TrashIcon className="w-5 h-5" />} aria-label="Delete Student"><span className="hidden sm:inline">Delete</span></Button>}
                 </PageActions>
            </PageHeader>

            <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-md p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                     <div className="relative group flex-shrink-0">
                        {student.profilePhoto ? (
                            <img src={student.profilePhoto} alt={`${student.firstName}`} className="w-32 h-32 rounded-full object-cover" />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center">
                                <UserIcon className="w-16 h-16 text-gray-500 dark:text-gray-400" />
                            </div>
                        )}
                    </div>
                    <div className="flex-grow text-center md:text-left">
                        <h2 className="text-2xl font-bold text-black dark:text-white">{student.firstName} {student.lastName}</h2>
                        <p className="text-body-color dark:text-gray-300">{student.studentId}</p>
                        <p className="text-body-color dark:text-gray-300">Age: {calculateAge(student.dateOfBirth)} | Gender: {student.gender}</p>
                    </div>
                </div>
            </div>
            
            <Tabs tabs={tabs} />
            
            {(modal === 'add_report' || modal === 'edit_report') && (
                <Modal isOpen={true} onClose={() => setModal(null)} title={editingReport ? "Edit Academic Report" : "Add Academic Report"}>
                    <AcademicReportForm 
                        studentId={student.studentId}
                        initialData={editingReport}
                        onSave={handleSaveAcademicReport} 
                        onCancel={() => { setModal(null); setEditingReport(null); }}
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

            {modal === 'sponsorship' && (
                <SponsorshipFormModal
                    isOpen={true}
                    onClose={() => { setModal(null); setEditingSponsorship(null); }}
                    studentId={student.studentId}
                    initialData={editingSponsorship}
                    onSave={onDataChange}
                />
            )}
            
            {modal === 'upload_doc' && docUploadProps && (
                 <DocumentUploadModal
                    isOpen={true}
                    onClose={() => { setModal(null); setDocUploadProps(null); }}
                    studentId={student.studentId}
                    docType={docUploadProps.docType}
                    sponsorship={docUploadProps.sponsorship}
                    onUploadSuccess={onDataChange}
                />
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