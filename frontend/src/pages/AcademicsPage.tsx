import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { AcademicReport } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { PlusIcon, EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, AcademicsIcon } from '../components/Icons.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { SkeletonTable, SkeletonListItem } from '../components/SkeletonLoader.tsx';
import AcademicReportForm from '../components/AcademicReportForm.tsx';
import { AcademicReportFormData } from '@/components/schemas/academicReportSchema.ts';
import { useTableControls } from '../hooks/useTableControls.ts';
import Pagination from '../components/Pagination.tsx';
import AdvancedFilter, { FilterOption } from '../components/AdvancedFilter.tsx';
import ActiveFiltersDisplay from '../components/ActiveFiltersDisplay.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import Button from '@/components/ui/Button.tsx';
import Badge from '@/components/ui/Badge.tsx';
import EmptyState from '@/components/EmptyState.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import ActionDropdown from '@/components/ActionDropdown.tsx';
import { usePermissions } from '@/contexts/AuthContext.tsx';
import PageActions from '@/components/layout/PageActions.tsx';
import { usePaginatedData } from '@/hooks/usePaginatedData.ts';
import DataWrapper from '@/components/DataWrapper.tsx';
import useMediaQuery from '@/hooks/useMediaQuery.ts';
import MobileListItem from '@/components/ui/MobileListItem.tsx';

const AcademicsPage: React.FC = () => {
    const [filterOptionsData, setFilterOptionsData] = useState<{ years: string[], grades: string[] }>({ years: [], grades: [] });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalState, setModalState] = useState<'add' | 'edit' | null>(null);
    const [selectedReport, setSelectedReport] = useState<AcademicReport | null>(null);
    const { showToast } = useNotification();
    const { canCreate, canUpdate, canDelete } = usePermissions('academics');
    const isMobile = useMediaQuery('(max-width: 767px)');

    const {
        sortConfig, currentPage, filters, apiQueryString,
        handleSort, setCurrentPage, handleFilterChange, applyFilters, clearFilters
    } = useTableControls<AcademicReport>({
        initialSortConfig: { key: 'reportPeriod', order: 'desc' },
        initialFilters: { year: '', grade: '', status: '' }
    });

    const { 
        data: paginatedData, isLoading, isStale, refetch 
    } = usePaginatedData<AcademicReport>({
        fetcher: api.getAllAcademicReports,
        apiQueryString,
        cacheKeyPrefix: 'academics',
    });
    
    useEffect(() => {
        api.getAcademicFilterOptions().then(data => setFilterOptionsData(data));
    }, []);
    
    const filterOptions: FilterOption[] = [
        { id: 'year', label: 'Year', options: filterOptionsData.years.map(y => ({ value: y, label: y })) },
        { id: 'grade', label: 'Grade', options: filterOptionsData.grades.map(g => ({ value: g, label: `Grade ${g}`})) },
        { id: 'status', label: 'Status', options: [{value: 'Pass', label: 'Pass'}, {value: 'Fail', label: 'Fail'}] },
    ];

    const handleSaveReport = async (formData: AcademicReportFormData) => {
        setIsSubmitting(true);
        try {
            const { studentId, ...reportData } = formData;
            if (modalState === 'edit' && selectedReport) {
                const payload = { ...reportData, student: selectedReport.student };
                await api.updateAcademicReport(selectedReport.id, payload);
                showToast('Report updated successfully!', 'success');
            } else {
                await api.addAcademicReport(studentId, reportData);
                showToast('Report added successfully!', 'success');
            }
            setModalState(null);
            setSelectedReport(null);
            refetch();
        } catch (error: any) {
            showToast(error.message || 'Failed to save report.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (window.confirm(`Are you sure you want to delete this report?`)) {
            try {
                await api.deleteAcademicReport(reportId);
                showToast('Report deleted.', 'success');
                refetch();
            } catch (error: any) {
                showToast(error.message || 'Failed to delete report.', 'error');
            }
        }
    };
    
    const allReports = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    const mainContent = isLoading ? (
        isMobile ? (
            <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonListItem key={i} />)}
            </div>
        ) : <SkeletonTable rows={10} cols={6} />
    ) : (
        <DataWrapper isStale={isStale}>
            {allReports.length > 0 ? (
                isMobile ? (
                    <div className="space-y-3">
                        {allReports.map(report => (
                            <MobileListItem
                                key={report.id}
                                icon={<AcademicsIcon className="w-5 h-5 text-primary" />}
                                title={report.studentName || 'Unknown Student'}
                                subtitle={`${report.reportPeriod} - Grade ${report.gradeLevel}`}
                                rightContent={<Badge type={report.passFailStatus} />}
                                onClick={canUpdate ? () => { setSelectedReport(report); setModalState('edit'); } : undefined}
                            />
                        ))}
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="ui-table">
                                <thead>
                                    <tr>
                                        {(['studentName', 'reportPeriod', 'gradeLevel', 'overallAverage', 'passFailStatus'] as (keyof AcademicReport)[]).map(key => (
                                            <th key={key as string}>
                                                <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key)}>
                                                    {String(key).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                    {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                                </button>
                                            </th>
                                        ))}
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allReports.map(report => {
                                        const actionItems = [];
                                        if (canUpdate) {
                                            actionItems.push({ label: 'Edit', icon: <EditIcon className="w-4 h-4" />, onClick: () => { setSelectedReport(report); setModalState('edit'); } });
                                        }
                                        if (canDelete) {
                                            actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleDeleteReport(report.id), className: 'text-danger' });
                                        }

                                        return (
                                            <tr key={report.id}>
                                                <td className="font-medium">{report.studentName}</td>
                                                <td className="text-body-color">{report.reportPeriod}</td>
                                                <td className="text-body-color">{report.gradeLevel}</td>
                                                <td className="text-body-color">{report.overallAverage ? report.overallAverage.toFixed(1) + '%' : 'N/A'}</td>
                                                <td>
                                                    <Badge type={report.passFailStatus} />
                                                </td>
                                                <td className="text-center">
                                                    {actionItems.length > 0 && <ActionDropdown items={actionItems} />}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </>
                )
            ) : (
                <EmptyState title="No Academic Reports Found" />
            )}
        </DataWrapper>
    );

    return (
        <div className="space-y-6">
            <PageHeader title="Academics">
                {canCreate && (
                    <PageActions>
                        <Button 
                            onClick={() => { setSelectedReport(null); setModalState('add'); }} 
                            icon={<PlusIcon className="w-5 h-5" />}
                            aria-label="Add Report"
                        >
                            <span className="hidden sm:inline">Add Report</span>
                        </Button>
                    </PageActions>
                )}
            </PageHeader>
           
            <Card>
                <CardContent>
                    <div className="p-4 mb-4 rounded-lg bg-gray-2 dark:bg-box-dark-2 border border-stroke dark:border-strokedark">
                        <div className="flex justify-end">
                            <AdvancedFilter
                               filterOptions={filterOptions}
                               currentFilters={filters}
                               onApply={applyFilters}
                               onClear={clearFilters}
                           />
                        </div>
                        <ActiveFiltersDisplay activeFilters={filters} onRemoveFilter={(key) => handleFilterChange(key, '')} />
                    </div>
                    {mainContent}
                </CardContent>
            </Card>
            
            <Modal isOpen={!!modalState} onClose={() => setModalState(null)} title={modalState === 'edit' ? 'Edit Academic Report' : 'Add New Academic Report'}>
                <AcademicReportForm 
                    key={selectedReport ? selectedReport.id : 'new-report'}
                    onSave={handleSaveReport} 
                    onCancel={() => setModalState(null)}
                    initialData={selectedReport}
                    isSaving={isSubmitting}
                />
            </Modal>
        </div>
    );
};

export default AcademicsPage;