import React, { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import { api } from '@/services/api.ts';
import { Student, PaginatedResponse, StudentStatus, SponsorshipStatus, Gender } from '@/types.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { SkeletonTable, SkeletonCard } from '@/components/SkeletonLoader.tsx';
import { useTableControls } from '@/hooks/useTableControls.ts';
import Pagination from '@/components/Pagination.tsx';
import { PlusIcon, UploadIcon, SearchIcon, SparklesIcon, ArrowUpIcon, ArrowDownIcon } from '@/components/Icons.tsx';
import StudentDetailView from '@/components/students/StudentDetailView.tsx';
import Modal from '@/components/Modal.tsx';
import StudentImportModal from '@/components/students/StudentImportModal.tsx';
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
import PageActions from '@/components/layout/PageActions.tsx';
import useMediaQuery from '@/hooks/useMediaQuery.ts';
import StudentSwipeView from '@/components/students/StudentSwipeView.tsx';
import StudentCard from '@/components/students/StudentCard.tsx';
import ViewToggle from '@/components/ui/ViewToggle.tsx';

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
    const { sponsorLookup, refetchStudentLookup } = useData();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isShowingImportModal, setIsShowingImportModal] = useState(false);
    const { showToast } = useNotification();
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const { setIsBulkActionBarVisible } = useUI();
    const { canCreate, canUpdate } = usePermissions('students');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [aiSearchQuery, setAiSearchQuery] = useState('');
    const [allFetchedStudents, setAllFetchedStudents] = useState<Student[]>([]);
    const isMobile = useMediaQuery('(max-width: 767px)');
    const { studentTableColumns, studentViewMode, setStudentViewMode } = useSettings();

    const { isAiEnabled } = useSettings();

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
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const studentsData = await api.getStudents(apiQueryString);
            setPaginatedData(studentsData);

            if (isMobile) {
                if (currentPage === 1) {
                    setAllFetchedStudents(studentsData.results);
                } else {
                    setAllFetchedStudents(prev => {
                        const existingIds = new Set(prev.map(s => s.studentId));
                        const newStudents = studentsData.results.filter(s => !existingIds.has(s.studentId));
                        return [...prev, ...newStudents];
                    });
                }
            }

        } catch (error: any) {
            showToast(error.message || 'Failed to load student data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiQueryString, showToast, isMobile, currentPage]);

    useEffect(() => {
        if (currentPage === 1) {
            setAllFetchedStudents([]);
        }
    }, [apiQueryString]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    useEffect(() => {
        const showBar = selectedStudentIds.size > 0 && canUpdate;
        setIsBulkActionBarVisible(showBar);
        // If selection is active, stay in selection mode. If not, exit.
        if (!showBar) {
            setIsSelectionMode(false);
        }
        
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
    
    const handleBulkUpdateStatus = async (status: StudentStatus) => {
        const studentIdsToUpdate = Array.from(selectedStudentIds);
        try {
            const result = await api.bulkUpdateStudents(studentIdsToUpdate, { studentStatus: status });
            showToast(`${result.updatedCount} students updated to "${status}".`, 'success');
            setSelectedStudentIds(new Set());
            setIsSelectionMode(false);
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
            
            const { search, sponsorName, ...restFilters } = aiFilters;
            
            setSearchTerm(search || '');

            const finalFilters = { ...restFilters };

            if (sponsorName) {
                const sponsor = sponsorLookup.find(s => s.name.toLowerCase().includes(sponsorName.toLowerCase()));
                if (sponsor) {
                    finalFilters.sponsor = String(sponsor.id);
                } else {
                    showToast(`Sponsor "${sponsorName}" not found.`, 'info');
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
    
    const isInitialLoadAndEmpty = !loading && studentsList.length === 0 && !Object.values(filters).some(Boolean) && !searchTerm;

    const renderDesktopSkeletons = () => {
        if (studentViewMode === 'card') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            );
        }
        return <SkeletonTable rows={10} cols={studentTableColumns.length} />;
    };
    
    return (
        <div className="space-y-6">
            <PageHeader title={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : "Students"}>
                {!selectedStudent && canCreate && (
                    <PageActions>
                        <Button 
                            onClick={() => setIsShowingImportModal(true)} 
                            variant="secondary" 
                            icon={<UploadIcon className="w-5 h-5" />}
                            aria-label="Import"
                        >
                            <span className="hidden sm:inline">Import</span>
                        </Button>
                        <Button 
                            onClick={() => setEditingStudent({} as Student)} 
                            icon={<PlusIcon className="w-5 h-5" />}
                            aria-label="Add Student"
                        >
                           <span className="hidden sm:inline">Add Student</span>
                        </Button>
                    </PageActions>
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
                    <Card className="hidden md:block">
                        <CardContent>
                             <div className="p-4 rounded-lg bg-gray-2 dark:bg-box-dark-2 border border-stroke dark:border-strokedark mb-4">
                                {isAiEnabled && (
                                    <form onSubmit={handleAiSearch} className="flex items-center gap-2 mb-4">
                                        <div className="relative flex-grow">
                                            <input
                                                type="text"
                                                placeholder="Ask AI to find students (e.g., 'show all unsponsored girls')"
                                                value={aiSearchQuery}
                                                onChange={e => setAiSearchQuery(e.target.value)}
                                                className="w-full rounded-lg border-[1.5px] border-stroke bg-gray-2 py-2 pl-10 pr-4 font-medium outline-none transition focus:border-primary text-black dark:border-strokedark dark:bg-form-input dark:text-white"
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                <SparklesIcon className="text-body-color w-5 h-5"/>
                                            </div>
                                        </div>
                                        <Button type="submit" isLoading={isAiSearching} disabled={!aiSearchQuery.trim()} size="sm">
                                            Ask AI
                                        </Button>
                                    </form>
                                )}
                                <div className="flex flex-row justify-between items-center gap-4">
                                    <div className="relative flex-grow">
                                        <input
                                            type="text"
                                            placeholder="Search by name, ID, school..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 pl-10 pr-4 font-medium outline-none transition focus:border-primary active:border-primary text-black dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <SearchIcon className="w-5 h-5 text-body-color" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <AdvancedFilter
                                            filterOptions={filterOptions}
                                            currentFilters={filters}
                                            onApply={applyFilters}
                                            onClear={() => { clearFilters(); setSearchTerm(''); setAiSearchQuery(''); }}
                                        />
                                        {canUpdate && (
                                            !isSelectionMode ? (
                                                <Button onClick={() => setIsSelectionMode(true)} variant="ghost" size="sm">Select</Button>
                                            ) : (
                                                <Button onClick={() => { setIsSelectionMode(false); setSelectedStudentIds(new Set()); }} variant="ghost" size="sm">Cancel</Button>
                                            )
                                        )}
                                        <ViewToggle view={studentViewMode} onChange={setStudentViewMode} />
                                    </div>
                                </div>
                                <ActiveFiltersDisplay 
                                    activeFilters={{...filters, search: searchTerm}}
                                    onRemoveFilter={(key) => key === 'search' ? setSearchTerm('') : handleFilterChange(key, '')} 
                                    customLabels={{ sponsor: (id) => sponsorLookup.find(s => String(s.id) === id)?.name }}
                                />
                            </div>
                            
                            {loading ? renderDesktopSkeletons() : isInitialLoadAndEmpty ? (
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
                                    {studentsList.length > 0 ? (
                                        studentViewMode === 'card' ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {studentsList.map((student) => (
                                                    <StudentCard
                                                        key={student.studentId}
                                                        student={student}
                                                        isSelected={selectedStudentIds.has(student.studentId)}
                                                        onSelect={handleSelectStudent}
                                                        onViewProfile={setSelectedStudent}
                                                        canUpdate={canUpdate}
                                                        isSelectionMode={isSelectionMode}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="ui-table">
                                                    <thead>
                                                        <tr>
                                                            {canUpdate && isSelectionMode && <th className="w-12"></th>}
                                                            {studentTableColumns.map(col => (
                                                                <th key={col.id as string}>
                                                                    <button className="flex items-center gap-1 hover:text-primary" onClick={() => handleSort(col.id as keyof Student)}>
                                                                        {col.label}
                                                                        {sortConfig?.key === col.id && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                                                    </button>
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {studentsList.map(s => (
                                                            <tr key={s.studentId} className="cursor-pointer" onClick={() => setSelectedStudent(s)}>
                                                                {canUpdate && isSelectionMode && (
                                                                    <td onClick={e => e.stopPropagation()}>
                                                                        <input type="checkbox" className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary" checked={selectedStudentIds.has(s.studentId)} onChange={e => handleSelectStudent(s.studentId, e.target.checked)} />
                                                                    </td>
                                                                )}
                                                                {studentTableColumns.map(col => (
                                                                    <td key={col.id as string}>
                                                                        {col.renderCell(s)}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )
                                    ) : (
                                        <EmptyState />
                                    )}
                                    {studentsList.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <div className="md:hidden space-y-4">
                        <div className="p-4 rounded-lg bg-white dark:bg-box-dark border border-stroke dark:border-strokedark">
                            <div className="flex flex-row items-center gap-2">
                                <div className="relative flex-grow">
                                    <input
                                        type="text"
                                        placeholder="Search by name, ID..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 pl-10 pr-4 font-medium outline-none transition focus:border-primary active:border-primary text-black dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <SearchIcon className="w-5 h-5 text-body-color" />
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    <AdvancedFilter
                                        filterOptions={filterOptions}
                                        currentFilters={filters}
                                        onApply={applyFilters}
                                        onClear={() => {
                                            clearFilters();
                                            setSearchTerm('');
                                            setAiSearchQuery('');
                                        }}
                                    />
                                </div>
                            </div>
                            <ActiveFiltersDisplay 
                                activeFilters={{...filters, search: searchTerm}}
                                onRemoveFilter={(key) => key === 'search' ? setSearchTerm('') : handleFilterChange(key, '')} 
                                customLabels={{ sponsor: (id) => sponsorLookup.find(s => String(s.id) === id)?.name }}
                            />
                        </div>

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
                            <StudentSwipeView
                                students={allFetchedStudents}
                                isLoading={loading && allFetchedStudents.length === 0}
                                loadMore={() => {
                                    if (!loading && currentPage < totalPages) {
                                        setCurrentPage(prev => prev + 1);
                                    }
                                }}
                                hasMore={currentPage < totalPages}
                                onViewProfile={setSelectedStudent}
                            />
                        )}
                    </div>


                    {selectedStudentIds.size > 0 && (
                        <BulkActionBar 
                            selectedCount={selectedStudentIds.size}
                            onUpdateStatus={handleBulkUpdateStatus}
                            onClearSelection={() => {
                                setSelectedStudentIds(new Set());
                                setIsSelectionMode(false);
                            }}
                        />
                    )}
                </>
            )}

            <Modal isOpen={!!editingStudent} onClose={() => setEditingStudent(null)} title={editingStudent?.studentId ? 'Edit Student' : 'Add New Student'}>
                <Suspense fallback={<FormLoader />}>
                    {editingStudent && (
                        <StudentForm 
                            key={editingStudent.studentId || 'new'}
                            student={editingStudent} 
                            onSave={handleSaveStudent} 
                            onCancel={() => setEditingStudent(null)}
                            isSaving={isSubmitting}
                        />
                    )}
                </Suspense>
            </Modal>
            
            {isShowingImportModal && (
                <StudentImportModal
                    existingStudents={[]}
                    studentsOnPage={studentsList}
                    onFinished={handleImportFinished}
                />
            )}
        </div>
    );
};

export default StudentsPage;