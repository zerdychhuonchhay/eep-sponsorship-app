



import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.ts';
import { AcademicReport, PaginatedResponse } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { PlusIcon, EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../components/Icons.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { SkeletonTable } from '../components/SkeletonLoader.tsx';
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

const AcademicsPage: React.FC = () => {
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<AcademicReport> | null>(null);
    const [filterOptionsData, setFilterOptionsData] = useState<{ years: string[], grades: string[] }>({ years: [], grades: [] });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalState, setModalState] = useState<'add' | 'edit' | null>(null);
    const [selectedReport, setSelectedReport] = useState<AcademicReport | null>(null);
    const { showToast } = useNotification();
    const { canCreate, canUpdate, canDelete } = usePermissions('academics');

    const {
        sortConfig, currentPage, filters, apiQueryString,
        handleSort, setCurrentPage, handleFilterChange, applyFilters, clearFilters
    } = useTableControls<AcademicReport>({
        initialSortConfig: { key: 'reportPeriod', order: 'desc' },
        initialFilters: { year: '', grade: '', status: '' }
    });
    
    const filterOptions: FilterOption[] = [
        { id: 'year', label: 'Year', options: filterOptionsData.years.map(y => ({ value: y, label: y })) },
        { id: 'grade', label: 'Grade', options: filterOptionsData.grades.map(g => ({ value: g, label: `Grade ${g}`})) },
        { id: 'status', label: 'Status', options: [{value: 'Pass', label: 'Pass'}, {value: 'Fail', label: 'Fail'}] },
    ];

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [reportsData, optionsData] = await Promise.all([
                api.getAllAcademicReports(apiQueryString),
                api.getAcademicFilterOptions()
            ]);
            setPaginatedData(reportsData);
            setFilterOptionsData(optionsData);
        } catch (error: any) {
            showToast(error.message || 'Failed to load academic data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiQueryString, showToast]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

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
            fetchAllData();
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
                fetchAllData();
            } catch (error: any) {
                showToast(error.message || 'Failed to delete report.', 'error');
            }
        }
    };
    
    const allReports = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    if (loading && !paginatedData) {
        return (
            <>
                <PageHeader title="Academics" />
                <SkeletonTable rows={10} cols={6} />
            </>
        )
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Academics">
                {canCreate && (
                    <Button onClick={() => { setSelectedReport(null); setModalState('add'); }} icon={<PlusIcon className="w-5 h-5" />}>
                        Add Report
                    </Button>
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                 <tr className="bg-gray-2 dark:bg-box-dark-2">
                                    {(['studentName', 'reportPeriod', 'gradeLevel', 'overallAverage', 'passFailStatus'] as (keyof AcademicReport)[]).map(key => (
                                        <th key={key as string} className="py-4 px-4 font-medium text-black dark:text-white">
                                            <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key)}>
                                                {String(key).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                            </button>
                                        </th>
                                    ))}
                                    <th className="py-4 px-4 font-medium text-black dark:text-white text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allReports.length > 0 ? allReports.map(report => {
                                    const actionItems = [];
                                    if (canUpdate) {
                                        actionItems.push({ label: 'Edit', icon: <EditIcon className="w-4 h-4" />, onClick: () => { setSelectedReport(report); setModalState('edit'); } });
                                    }
                                    if (canDelete) {
                                        actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleDeleteReport(report.id), className: 'text-danger' });
                                    }

                                    return (
                                        <tr key={report.id} className="hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                            <td className="py-5 px-4 font-medium text-black dark:text-white border-b border-stroke dark:border-strokedark">{report.studentName}</td>
                                            <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{report.reportPeriod}</td>
                                            <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{report.gradeLevel}</td>
                                            <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{report.overallAverage ? report.overallAverage.toFixed(1) + '%' : 'N/A'}</td>
                                            <td className="py-5 px-4 border-b border-stroke dark:border-strokedark">
                                                <Badge type={report.passFailStatus} />
                                            </td>
                                            <td className="py-5 px-4 border-b border-stroke dark:border-strokedark text-center">
                                                {actionItems.length > 0 && <ActionDropdown items={actionItems} />}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState title="No Academic Reports Found" />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {allReports.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
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