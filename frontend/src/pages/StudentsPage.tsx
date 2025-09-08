import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { api } from '@/services/api.ts';
import { Student, FollowUpRecord, AcademicReport, PaginatedResponse, StudentLookup, StudentStatus, SponsorshipStatus, Gender } from '@/types.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { useDebugNotification } from '@/contexts/DebugNotificationContext.tsx';
import { SkeletonTable } from '@/components/SkeletonLoader.tsx';
import { useTableControls } from '@/hooks/useTableControls.ts';
import Pagination from '@/components/Pagination.tsx';
import { PlusIcon, UploadIcon, ArrowUpIcon, ArrowDownIcon, UserIcon } from '@/components/Icons.tsx';
import StudentDetailView from '@/components/students/StudentDetailView.tsx';
import Modal from '@/components/Modal.tsx';
import StudentImportModal from '@/components/students/StudentImportModal.tsx';
import PrintableFollowUpRecord from '@/components/students/PrintableFollowUpRecord.tsx';
import AdvancedFilter, { FilterOption } from '@/components/AdvancedFilter.tsx';
import ActiveFiltersDisplay from '@/components/ActiveFiltersDisplay.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import Button from '@/components/ui/Button.tsx';
import Badge from '@/components/ui/Badge.tsx';
import EmptyState from '@/components/EmptyState.tsx';

const StudentForm = lazy(() => import('@/components/students/StudentForm.tsx'));

// --- Helper Functions ---
export const calculateAge = (dob: string): number | string => {
    if (!dob || isNaN(new Date(dob).getTime())) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export const formatDateForDisplay = (dateStr?: string) => {
    if (!dateStr || isNaN(new Date(dateStr).getTime())) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
}

const FormLoader: React.FC = () => (
    <div className="flex justify-center items-center h-96">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

// --- Main Page Component ---
const StudentsPage: React.FC = () => {
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Student> | null>(null);
    const [studentLookup, setStudentLookup] = useState<StudentLookup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isShowingImportModal, setIsShowingImportModal] = useState(false);
    const [recordForPdf, setRecordForPdf] = useState<FollowUpRecord | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const printableRef = useRef<HTMLDivElement>(null);
    const { showToast } = useNotification();
    const { logEvent } = useDebugNotification();

    const {
        sortConfig, currentPage, searchTerm, filters, apiQueryString,
        handleSort, setCurrentPage, setSearchTerm, handleFilterChange, applyFilters, clearFilters
    } = useTableControls<Student>({ 
        initialSortConfig: { key: 'firstName', order: 'asc' },
        initialFilters: { student_status: '', sponsorship_status: '', gender: '' }
    });
    
    const filterOptions: FilterOption[] = [
        { id: 'student_status', label: 'Status', options: Object.values(StudentStatus).map(s => ({ value: s, label: s })) },
        { id: 'sponsorship_status', label: 'Sponsorship', options: Object.values(SponsorshipStatus).map(s => ({ value: s, label: s })) },
        { id: 'gender', label: 'Gender', options: Object.values(Gender).map(g => ({ value: g, label: g })) },
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [studentsData, studentLookupData] = await Promise.all([
                api.getStudents(apiQueryString),
                api.getStudentLookup()
            ]);
            setPaginatedData(studentsData);
            setStudentLookup(studentLookupData);
        } catch (error: any) {
            showToast(error.message || 'Failed to load student data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiQueryString, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    useEffect(() => {
        if (!recordForPdf || !printableRef.current) return;
    
        const generatePdf = async () => {
            const { jsPDF } = (window as any).jspdf;
            const html2canvas = (window as any).html2canvas;
            const elementToCapture = printableRef.current!;
            logEvent(`Generating PDF for ${recordForPdf.childName}`, 'info');
    
            try {
                const canvas = await html2canvas(elementToCapture, { scale: 2, useCORS: true, windowWidth: elementToCapture.scrollWidth, windowHeight: elementToCapture.scrollHeight });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                const pdfHeight = pdfWidth / ratio;
    
                let position = 0;
                let heightLeft = canvasHeight;
                const pageHeight = canvasWidth / (pdfWidth / pdfHeight);
    
                pdf.addImage(imgData, 'PNG', 0, position, canvasWidth, canvasHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
    
                while (heightLeft > 0) {
                    position -= pageHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, canvasWidth, canvasHeight, undefined, 'FAST');
                    heightLeft -= pageHeight;
                }
                
                const studentName = recordForPdf.childName.replace(/\s+/g, '-');
                const date = new Date(recordForPdf.dateOfFollowUp).toISOString().split('T')[0];
                pdf.save(`Follow-Up-Report-${studentName}-${date}.pdf`);
    
            } catch (error) {
                console.error("Error generating PDF:", error);
                showToast('An error occurred while generating the PDF.', 'error');
            } finally {
                setRecordForPdf(null);
                setIsGeneratingPdf(false);
            }
        };
        const timer = setTimeout(generatePdf, 100);
        return () => clearTimeout(timer);
    }, [recordForPdf, showToast, logEvent]);

    const handleSaveStudent = async (studentData: any) => {
        setIsSubmitting(true);
        try {
            if (editingStudent) {
                await api.updateStudent({ ...studentData, studentId: editingStudent.studentId });
                showToast('Student updated successfully!', 'success');
            } else {
                await api.addStudent(studentData);
                showToast('Student added successfully!', 'success');
            }
            setEditingStudent(null);
            fetchData();
        } catch (error: any) {
            showToast(error.message || 'Failed to save student.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteStudent = async (studentId: string) => {
        if(window.confirm('Are you sure you want to delete this student? This will also remove all associated records.')) {
            try {
                await api.deleteStudent(studentId);
                showToast('Student deleted.', 'success');
                setSelectedStudent(null);
                fetchData();
            } catch (error: any) {
                showToast(error.message || 'Failed to delete student.', 'error');
            }
        }
    };
    
    const refreshSelectedStudent = useCallback(async () => {
        if (!selectedStudent) return;
        try {
            const updatedStudent = await api.getStudentById(selectedStudent.studentId);
            setSelectedStudent(updatedStudent);
        } catch(e) {
            showToast("Could not refresh student data.", 'error');
            setSelectedStudent(null);
        }
    }, [selectedStudent, showToast]);

    const handleImportFinished = () => {
        setIsShowingImportModal(false);
        fetchData();
    };

    const handleDownloadPdf = (record: FollowUpRecord) => {
        if (typeof (window as any).jspdf === 'undefined' || typeof (window as any).html2canvas === 'undefined') {
            showToast('PDF generation libraries are still loading. Please try again.', 'error');
            return;
        }
        setIsGeneratingPdf(true);
        setRecordForPdf(record);
    };
    
    const studentsList = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    if (loading && !paginatedData) {
        return (
            <>
                <PageHeader title="Students" />
                <SkeletonTable rows={10} cols={6} />
            </>
        )
    };
    
    return (
        <>
            <PageHeader title={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : "Students"}>
                {!selectedStudent && (
                    <>
                        <Button onClick={() => setIsShowingImportModal(true)} variant="secondary" icon={<UploadIcon />}>
                            Import
                        </Button>
                        <Button onClick={() => setEditingStudent({} as Student)} icon={<PlusIcon />}>
                            Add Student
                        </Button>
                    </>
                )}
            </PageHeader>

            {selectedStudent ? (
                <StudentDetailView 
                    student={selectedStudent} 
                    onBack={() => setSelectedStudent(null)}
                    onEdit={(student) => setEditingStudent(student)}
                    onDelete={handleDeleteStudent}
                    onDownloadFollowUp={handleDownloadPdf}
                    isGeneratingPdf={isGeneratingPdf}
                    recordForPdf={recordForPdf}
                    students={studentLookup}
                    onDataChange={refreshSelectedStudent}
                />
            ) : (
                <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-md">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <input type="text" placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-auto rounded-lg border-[1.5px] border-stroke bg-gray-2 py-2 px-5 font-medium outline-none transition focus:border-primary text-black dark:border-strokedark dark:bg-form-input dark:text-white"/>
                         <AdvancedFilter
                            filterOptions={filterOptions}
                            currentFilters={filters}
                            onApply={applyFilters}
                            onClear={clearFilters}
                        />
                    </div>

                    <ActiveFiltersDisplay activeFilters={filters} onRemoveFilter={(key) => handleFilterChange(key, '')} />

                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-2 dark:bg-box-dark-2">
                                    {[
                                        { key: 'firstName', label: 'Name' },
                                        { key: 'studentId', label: 'Student ID' },
                                        { key: 'age', label: 'Age' },
                                        { key: 'studentStatus', label: 'Status' },
                                        { key: 'sponsorshipStatus', label: 'Sponsorship' },
                                    ] .map(({key, label}) => (
                                        <th key={key as string} className="py-4 px-4 font-medium text-black dark:text-white">
                                            <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key)}>
                                                {label}
                                                {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {studentsList.length > 0 ? studentsList.map((s, i) => (
                                    <tr key={`${s.studentId}-${i}`} className="cursor-pointer hover:bg-gray-2 dark:hover:bg-box-dark-2" onClick={() => setSelectedStudent(s)}>
                                        <td className="py-5 px-4 flex items-center gap-3 border-b border-stroke dark:border-strokedark">
                                            {s.profilePhoto ? (
                                                <img src={s.profilePhoto} alt={`${s.firstName}`} className="w-10 h-10 rounded-full object-cover"/>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center">
                                                    <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-black dark:text-white">{s.firstName} {s.lastName}</p>
                                                <p className="text-sm text-body-color dark:text-gray-300">{s.gender}</p>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4 text-black dark:text-white border-b border-stroke dark:border-strokedark">{s.studentId}</td>
                                        <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{calculateAge(s.dateOfBirth)}</td>
                                        <td className="py-5 px-4 border-b border-stroke dark:border-strokedark"><Badge type={s.studentStatus} /></td>
                                        <td className="py-5 px-4 border-b border-stroke dark:border-strokedark"><Badge type={s.sponsorshipStatus} /></td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5}>
                                            <EmptyState title="No Students Found" />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {studentsList.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                </div>
            )}
            
            {/* --- MODALS --- */}
            {/* These are now outside the conditional rendering to ensure they can be triggered from either view */}
            <Modal isOpen={!!editingStudent} onClose={() => setEditingStudent(null)} title={editingStudent?.studentId ? 'Edit Student' : 'Add New Student'}>
                <Suspense fallback={<FormLoader />}>
                    {editingStudent && (
                        <StudentForm 
                            key={editingStudent ? editingStudent.studentId : 'new-student'}
                            student={editingStudent} 
                            onSave={handleSaveStudent} 
                            onCancel={() => setEditingStudent(null)}
                            isSaving={isSubmitting}
                        />
                    )}
                </Suspense>
            </Modal>
            
            {isShowingImportModal && <StudentImportModal existingStudents={studentsList} onFinished={handleImportFinished} />}

            {recordForPdf && selectedStudent && (
                 <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }} ref={printableRef}>
                    <PrintableFollowUpRecord record={recordForPdf} student={selectedStudent} />
                </div>
            )}
        </>
    );
};

export default StudentsPage;