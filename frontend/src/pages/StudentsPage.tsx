import React, { useState, useEffect, useCallback, useRef, lazy, Suspense, useMemo } from 'react';
import { api } from '@/services/api.ts';
import { Student, FollowUpRecord, PaginatedResponse, StudentStatus, SponsorshipStatus, Gender } from '@/types.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { SkeletonTable } from '@/components/SkeletonLoader.tsx';
import { useTableControls } from '@/hooks/useTableControls.ts';
import Pagination from '@/components/Pagination.tsx';
import { PlusIcon, UploadIcon, ArrowUpIcon, ArrowDownIcon, UserIcon, SearchIcon } from '@/components/Icons.tsx';
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
import { usePdfGenerator } from '@/hooks/usePdfGenerator.ts';
import { calculateAge } from '@/utils/dateUtils.ts';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import { useUI } from '@/contexts/UIContext.tsx';
import BulkActionBar from '@/components/students/BulkActionBar.tsx';
import { usePermissions } from '@/contexts/AuthContext.tsx';

const StudentForm = lazy(() => import('@/components/students/StudentForm.tsx'));

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
    const { studentLookup, sponsorLookup, refetchStudentLookup } = useData();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isShowingImportModal, setIsShowingImportModal] = useState(false);
    const [recordForPdf, setRecordForPdf] = useState<FollowUpRecord | null>(null);
    const printableRef = useRef<HTMLDivElement>(null);
    const { isGenerating: isGeneratingPdf, generatePdf } = usePdfGenerator(printableRef);
    const { showToast } = useNotification();
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const { setIsBulkActionBarVisible } = useUI();
    const { canCreate, canUpdate } = usePermissions('students');

    const {
        sortConfig, currentPage, searchTerm, filters, apiQueryString,
        handleSort, setCurrentPage, setSearchTerm, handleFilterChange, applyFilters, clearFilters
    } = useTableControls<Student>({ 
        initialSortConfig: { key: 'firstName', order: 'asc' },
        initialFilters: { student_status: '', sponsorship_status: '', gender: '', sponsor: '' }
    });
    
    const filterOptions: FilterOption[] = [
        { id: 'student_status', label: 'Status', options: Object.values(StudentStatus).map(s => ({ value: s, label: s })) },
        { id: 'sponsorship_status', label: 'Sponsorship', options: Object.values(SponsorshipStatus).map(s => ({ value: s, label: s })) },
        { id: 'gender', label: 'Gender', options: Object.values(Gender).map(g => ({ value: g, label: g })) },
        { id: 'sponsor', label: 'Sponsor', options: sponsorLookup.map(s => ({ value: String(s.id), label: s.name })) }
    ];
    
    const studentsList = useMemo(() => paginatedData?.results || [], [paginatedData]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const studentsData = await api.getStudents(apiQueryString);
            setPaginatedData(studentsData);
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
        setIsBulkActionBarVisible(selectedStudentIds.size > 0 && canUpdate);
        
        return () => {
            setIsBulkActionBarVisible(false);
        };
    }, [selectedStudentIds.size, setIsBulkActionBarVisible, canUpdate]);


    useEffect(() => {
        const currentPageIds = new Set(studentsList.map(s => s.studentId));
        setSelectedStudentIds(prev => new Set([...prev].filter(id => currentPageIds.has(id))));
    }, [studentsList]);

    const handleSaveStudent = async (studentData: any) => {
        setIsSubmitting(true);
        try {
            if (editingStudent?.studentId) {
                await api.updateStudent({ ...studentData, studentId: editingStudent.studentId });
                showToast('Student updated successfully!', 'success');
            } else {
                await api.addStudent(studentData);
                showToast('Student added successfully!', 'success');
            }
            setEditingStudent(null);
            fetchData();
            refetchStudentLookup();
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
                refetchStudentLookup();
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
        refetchStudentLookup();
    };

    const handleDownloadPdf = (record: FollowUpRecord) => {
        setRecordForPdf(record);
        setTimeout(() => {
            const studentName = record.childName.replace(/\s+/g, '-');
            const date = new Date(record.dateOfFollowUp).toISOString().split('T')[0];
            generatePdf(`Follow-Up-Report-${studentName}-${date}`).finally(() => {
                setRecordForPdf(null);
            });
        }, 100);
    };

    const handleSelectStudent = (studentId: string, isSelected: boolean) => {
        setSelectedStudentIds(prev => {
            const newSet = new Set(prev);
            if (isSelected) newSet.add(studentId);
            else newSet.delete(studentId);
            return newSet;
        });
    };

    const handleSelectAll = (isSelected: boolean) => {
        if (isSelected) setSelectedStudentIds(new Set(studentsList.map(s => s.studentId)));
        else setSelectedStudentIds(new Set());
    };
    
    const handleBulkUpdateStatus = async (status: StudentStatus) => {
        const studentIdsToUpdate = Array.from(selectedStudentIds);
        try {
            const result = await api.bulkUpdateStudents(studentIdsToUpdate, { studentStatus: status });
            showToast(`${result.updatedCount} students updated to "${status}".`, 'success');
            setSelectedStudentIds(new Set());
            fetchData();
        } catch(error: any) {
            showToast(error.message || 'Failed to perform bulk update.', 'error');
        }
    };
    
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;
    const isInitialLoadAndEmpty = !loading && studentsList.length === 0 && !Object.values(filters).some(Boolean) && !searchTerm;
    const isAllSelected = studentsList.length > 0 && selectedStudentIds.size === studentsList.length;

    if (loading && !paginatedData) {
        return (
            <>
                <PageHeader title="Students" />
                <SkeletonTable rows={10} cols={7} />
            </>
        )
    };
    
    return (
        <div className="space-y-6">
            <PageHeader title={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : "Students"}>
                {!selectedStudent && canCreate && (
                    <>
                        <Button onClick={() => setIsShowingImportModal(true)} variant="secondary" icon={<UploadIcon className="w-5 h-5" />}>
                            Import
                        </Button>
                        <Button onClick={() => setEditingStudent({} as Student)} icon={<PlusIcon className="w-5 h-5" />}>
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
                    onDataChange={refreshSelectedStudent}
                />
            ) : (
                <>
                    <Card>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="relative w-full sm:w-1/2 md:w-1/3">
                                   <input type="text" placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-lg border-[1.5px] border-stroke bg-gray-2 py-2 pl-10 pr-5 font-medium outline-none transition focus:border-primary text-black dark:border-strokedark dark:bg-form-input dark:text-white"/>
                                   <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-body-color w-5 h-5" />
                                </div>
                                 <AdvancedFilter
                                    filterOptions={filterOptions}
                                    currentFilters={filters}
                                    onApply={applyFilters}
                                    onClear={clearFilters}
                                />
                            </div>

                            <ActiveFiltersDisplay 
                                activeFilters={filters} 
                                onRemoveFilter={(key) => handleFilterChange(key, '')} 
                                customLabels={{ sponsor: (id) => sponsorLookup.find(s => s.id === id)?.name }}
                            />
                            
                            {isInitialLoadAndEmpty ? (
                                <div className="mt-4">
                                    <EmptyState 
                                        title="No Students in System"
                                        message="Get started by adding your first student or importing a list."
                                        action={ canCreate && (
                                            <div className="flex justify-center gap-4">
                                                <Button onClick={() => setEditingStudent({} as Student)} icon={<PlusIcon className="w-5 h-5" />}>
                                                    Add Student
                                                </Button>
                                                <Button onClick={() => setIsShowingImportModal(true)} variant="secondary" icon={<UploadIcon className="w-5 h-5" />}>
                                                    Import Students
                                                </Button>
                                            </div>
                                        )}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="mt-4">
                                        <table className="w-full text-left hidden md:table">
                                            <thead>
                                                <tr className="bg-gray-2 dark:bg-box-dark-2">
                                                    <th className="py-4 px-4 font-medium text-black dark:text-white">
                                                         {canUpdate && <input type="checkbox" className="form-checkbox" checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} />}
                                                    </th>
                                                    {[
                                                        { key: 'firstName', label: 'Name' },
                                                        { key: 'studentId', label: 'Student ID' },
                                                        { key: 'age', label: 'Age' },
                                                        { key: 'studentStatus', label: 'Status' },
                                                        { key: 'sponsorshipStatus', label: 'Sponsorship' },
                                                        { key: 'sponsorName', label: 'Sponsor' },
                                                    ] .map(({key, label}) => (
                                                        <th key={key as string} className="py-4 px-4 font-medium text-black dark:text-white">
                                                            <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key as keyof Student)}>
                                                                {label}
                                                                {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                                            </button>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentsList.length > 0 ? studentsList.map((s) => (
                                                    <tr key={s.studentId} className={`hover:bg-gray-2 dark:hover:bg-box-dark-2 ${selectedStudentIds.has(s.studentId) ? 'bg-primary/10' : ''}`}>
                                                        <td className="py-5 px-4 border-b border-stroke dark:border-strokedark">
                                                            {canUpdate && <input type="checkbox" className="form-checkbox" checked={selectedStudentIds.has(s.studentId)} onChange={(e) => handleSelectStudent(s.studentId, e.target.checked)} />}
                                                        </td>
                                                        <td className="py-5 px-4 border-b border-stroke dark:border-strokedark">
                                                            <div className="flex items-center gap-3">
                                                                {s.profilePhoto ? (
                                                                    <img src={s.profilePhoto} alt={`${s.firstName}`} className="w-10 h-10 rounded-full object-cover"/>
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center">
                                                                        <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <button onClick={() => setSelectedStudent(s)} className="font-medium text-black dark:text-white hover:text-primary text-left">
                                                                        {s.firstName} {s.lastName}
                                                                    </button>
                                                                    <p className="text-sm text-body-color dark:text-gray-300">{s.gender}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-4 text-black dark:text-white border-b border-stroke dark:border-strokedark">{s.studentId}</td>
                                                        <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{calculateAge(s.dateOfBirth)}</td>
                                                        <td className="py-5 px-4 border-b border-stroke dark:border-strokedark"><Badge type={s.studentStatus} /></td>
                                                        <td className="py-5 px-4 border-b border-stroke dark:border-strokedark"><Badge type={s.sponsorshipStatus} /></td>
                                                        <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{s.sponsorName || 'N/A'}</td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={7}>
                                                            <EmptyState title="No Students Found" />
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                                            {studentsList.length > 0 ? studentsList.map((s) => (
                                                <div key={s.studentId} className={`bg-white dark:bg-box-dark rounded-lg p-4 border border-stroke dark:border-strokedark shadow-sm relative ${selectedStudentIds.has(s.studentId) ? 'ring-2 ring-primary' : ''}`}>
                                                    <div className="absolute top-2 right-2">
                                                        {canUpdate && <input type="checkbox" className="form-checkbox h-5 w-5" checked={selectedStudentIds.has(s.studentId)} onChange={(e) => handleSelectStudent(s.studentId, e.target.checked)} />}
                                                    </div>
                                                    <div className="flex items-center gap-4 mb-3">
                                                        {s.profilePhoto ? (
                                                            <img src={s.profilePhoto} alt={`${s.firstName}`} className="w-12 h-12 rounded-full object-cover"/>
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center flex-shrink-0">
                                                                <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <button onClick={() => setSelectedStudent(s)} className="font-bold text-lg text-black dark:text-white truncate text-left hover:text-primary">
                                                                {s.firstName} {s.lastName}
                                                            </button>
                                                            <p className="text-sm text-body-color dark:text-gray-300">{s.studentId}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-body-color dark:text-gray-300 mb-2">Sponsor: <span className="font-medium text-black dark:text-white">{s.sponsorName || 'N/A'}</span></p>
                                                     <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-3 border-t border-stroke dark:border-strokedark">
                                                        <div>
                                                            <p className="text-body-color dark:text-gray-300">Age: {calculateAge(s.dateOfBirth)}</p>
                                                            <p className="text-body-color dark:text-gray-300">Gender: {s.gender}</p>
                                                        </div>
                                                        <div className="space-y-1.5 flex flex-col items-start">
                                                           <div className="flex items-center gap-1">
                                                                <span className="text-body-color dark:text-gray-300 text-xs">Status:</span>
                                                                <Badge type={s.studentStatus} />
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-body-color dark:text-gray-300 text-xs">Sponsor:</span>
                                                                <Badge type={s.sponsorshipStatus} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                 <EmptyState title="No Students Found" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {studentsList.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            <BulkActionBar
                selectedCount={selectedStudentIds.size}
                onUpdateStatus={handleBulkUpdateStatus}
                onClearSelection={() => setSelectedStudentIds(new Set())}
            />
            
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
            
            {isShowingImportModal && <StudentImportModal existingStudents={studentLookup} onFinished={handleImportFinished} />}

            {recordForPdf && selectedStudent && (
                 <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }} ref={printableRef}>
                    <PrintableFollowUpRecord record={recordForPdf} student={selectedStudent} />
                </div>
            )}
        </div>
    );
};

export default StudentsPage;