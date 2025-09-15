import React, { useState, useEffect, useCallback, useRef, lazy, Suspense, useMemo } from 'react';
import { api } from '@/services/api.ts';
import { Student, FollowUpRecord, PaginatedResponse, StudentStatus, SponsorshipStatus, Gender } from '@/types.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { SkeletonTable } from '@/components/SkeletonLoader.tsx';
import { useTableControls } from '@/hooks/useTableControls.ts';
import Pagination from '@/components/Pagination.tsx';
import { PlusIcon, UploadIcon, ArrowUpIcon, ArrowDownIcon, UserIcon, SparklesIcon } from '@/components/Icons.tsx';
import StudentDetailView from '@/components/students/StudentDetailView.tsx';
import Modal from '@/components/Modal.tsx';
import StudentImportModal from '@/components/students/StudentImportModal.tsx';
import PrintableFollowUpRecord from '@/components/students/PrintableFollowUpRecord.tsx';
import AdvancedFilter, { FilterOption } from '@/components/AdvancedFilter.tsx';
import ActiveFiltersDisplay from '@/components/ActiveFiltersDisplay.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import Button from '@/components/ui/Button.tsx';
import EmptyState from '@/components/EmptyState.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import { useUI } from '@/contexts/UIContext.tsx';
import { useSettings } from '@/contexts/SettingsContext.tsx';
import BulkActionBar from '@/components/students/BulkActionBar.tsx';
import { usePermissions } from '@/contexts/AuthContext.tsx';
// FIX: Import the `Badge` component to resolve a "Cannot find name 'Badge'" error in the mobile student card view.
import Badge from '@/components/ui/Badge.tsx';

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
    const { showToast } = useNotification();
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const { setIsBulkActionBarVisible } = useUI();
    const { canCreate, canUpdate } = usePermissions('students');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [aiSearchQuery, setAiSearchQuery] = useState('');

    // Get column configuration from settings
    const { studentTableColumns } = useSettings();

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

    const handleAiSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!aiSearchQuery.trim()) return;

        setIsAiSearching(true);
        try {
            const aiFilters = await api.queryAIAssistantForStudentFilters(aiSearchQuery);
            
            const { search, sponsor_name, ...restFilters } = aiFilters;
            
            setSearchTerm(search || '');

            const finalFilters = { ...restFilters };

            if (sponsor_name) {
                const sponsor = sponsorLookup.find(s => s.name.toLowerCase().includes(sponsor_name.toLowerCase()));
                if (sponsor) {
                    finalFilters.sponsor = String(sponsor.id);
                } else {
                    showToast(`Sponsor "${sponsor_name}" not found.`, 'info');
                }
            }
            
            applyFilters(finalFilters);
            showToast('AI filters applied!', 'success');

        } catch (error: any) {
            showToast(error.message || 'AI search failed. Please try a different query.', 'error');
        } finally {
            setIsAiSearching(false);
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
                    onDataChange={refreshSelectedStudent}
                />
            ) : (
                <>
                    <Card>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <form onSubmit={handleAiSearch} className="w-full sm:flex-grow flex items-center gap-2">
                                    <div className="relative w-full">
                                        <input
                                            type="text"
                                            placeholder="Search with AI (e.g., 'show all unsponsored girls')"
                                            value={aiSearchQuery}
                                            onChange={e => setAiSearchQuery(e.target.value)}
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-gray-2 py-2 pl-4 pr-10 font-medium outline-none transition focus:border-primary text-black dark:border-strokedark dark:bg-form-input dark:text-white"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <SparklesIcon className="text-body-color w-5 h-5"/>
                                        </div>
                                    </div>
                                    <Button type="submit" isLoading={isAiSearching} disabled={!aiSearchQuery.trim()}>
                                        Search
                                    </Button>
                                </form>
                                 <AdvancedFilter
                                    filterOptions={filterOptions}
                                    currentFilters={filters}
                                    onApply={applyFilters}
                                    onClear={() => {
                                        clearFilters();
                                        setSearchTerm('');
                                    }}
                                />
                            </div>

                            <ActiveFiltersDisplay 
                                activeFilters={{...filters, search: searchTerm}}
                                onRemoveFilter={(key) => key === 'search' ? setSearchTerm('') : handleFilterChange(key, '')} 
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
                                                    {studentTableColumns.map(column => (
                                                        <th key={column.id} className="py-4 px-4 font-medium text-black dark:text-white">
                                                            <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(column.id)}>
                                                                {column.label}
                                                                {sortConfig?.key === column.id && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                                            </button>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentsList.length > 0 ? studentsList.map((student) => (
                                                    <tr key={student.studentId} className={`hover:bg-gray-2 dark:hover:bg-box-dark-2 ${selectedStudentIds.has(student.studentId) ? 'bg-primary/10' : ''}`}>
                                                        <td className="py-5 px-4 border-b border-stroke dark:border-strokedark">
                                                            {canUpdate && <input type="checkbox" className="form-checkbox" checked={selectedStudentIds.has(student.studentId)} onChange={(e) => handleSelectStudent(student.studentId, e.target.checked)} />}
                                                        </td>
                                                        {studentTableColumns.map(column => (
                                                            <td key={column.id} className="py-5 px-4 border-b border-stroke dark:border-strokedark text-black dark:text-white">
                                                                {/* Special case for clickable name */}
                                                                {column.id === 'firstName' ? (
                                                                    <button onClick={() => setSelectedStudent(student)} className="font-medium hover:text-primary text-left">
                                                                        {column.renderCell(student)}
                                                                    </button>
                                                                ) : (
                                                                    column.renderCell(student)
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={studentTableColumns.length + 1}>
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
                                                    <div className="text-sm text-body-color dark:text-gray-300 mb-2">
                                                        <p>Guardian: <span className="font-medium text-black dark:text-white">{s.guardianName || 'N/A'}</span></p>
                                                        <p>Sex: <span className="font-medium text-black dark:text-white">{s.gender}</span></p>
                                                    </div>
                                                     <div className="flex justify-between items-center text-sm pt-3 border-t border-stroke dark:border-strokedark">
                                                        <div className="space-y-1">
                                                            <p className="text-body-color dark:text-gray-300">Age: <span className="font-medium text-black dark:text-white">{studentTableColumns.find(c => c.id === 'age')?.renderCell(s)}</span></p>
                                                            <p className="text-body-color dark:text-gray-300">Grade: <span className="font-medium text-black dark:text-white">{s.currentGrade}</span></p>
                                                        </div>
                                                        <div>
                                                           <Badge type={s.studentStatus} />
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

        </div>
    );
};

export default StudentsPage;